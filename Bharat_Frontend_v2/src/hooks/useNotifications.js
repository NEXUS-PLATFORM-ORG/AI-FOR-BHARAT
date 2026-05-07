import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

import { API_NOTIF as API_BASE } from "../lib/apiConfig.js";

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────
function parseUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

/**
 * useNotifications — Secure multi-role realtime notification hook.
 *
 * Architecture (v2):
 *  • Uses Supabase Broadcast channels (not postgres_changes).
 *  • Database trigger fn_broadcast_notification() pushes to:
 *      – user:<userId>:notifications  (per-user private channel)
 *      – admin:notifications          (admin-only channel)
 *  • Normal users subscribe ONLY to their own channel.
 *  • Admins subscribe ONLY to admin:notifications.
 *  • Initial list comes from the backend REST API which enforces
 *    role-based filtering server-side.
 *
 * Usage:
 *   const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isLoading, setIsLoading]         = useState(true);
  const channelRef = useRef(null);

  const user    = parseUser();
  const userId  = user.id;
  const isAdmin = user.role === 'admin';

  // ─── REST: fetch initial list ─────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(API_BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = data.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read_at).length);
    } catch (err) {
      console.error('[Notifications] REST fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ─── Mark single as read ──────────────────────────────────────
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await fetch(`${API_BASE}/${notificationId}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[Notifications] markAsRead error:', err.message);
    }
  }, []);

  // ─── Mark all as read ─────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/read-all`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('[Notifications] markAllAsRead error:', err.message);
    }
  }, []);

  // ─── Realtime broadcast subscription ─────────────────────────
  useEffect(() => {
    if (!userId) return;

    // Initial load
    fetchNotifications();

    /**
     * Channel strategy (secure broadcast):
     *  Admin  → subscribes to "admin:notifications"
     *  User   → subscribes to "user:<userId>:notifications"
     *
     * Both channels are populated by the DB trigger
     * fn_broadcast_notification() which calls realtime.broadcast().
     */
    const channelName = isAdmin
      ? 'admin:notifications'
      : `user:${userId}:notifications`;

    console.log(`[Notifications] Subscribing to broadcast channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      // ── New notification created ──────────────────────────────
      .on('broadcast', { event: 'notification_created' }, ({ payload }) => {
        if (!payload) return;
        console.log('[Notifications] notification_created:', payload.title);
        setNotifications(prev => {
          // Guard: skip if already present (dedup)
          if (prev.some(n => n.id === payload.id)) return prev;
          return [payload, ...prev];
        });
        setUnreadCount(prev => prev + 1);
      })
      // ── Notification updated (e.g. read_at stamped) ───────────
      .on('broadcast', { event: 'notification_updated' }, ({ payload }) => {
        if (!payload) return;
        console.log('[Notifications] notification_updated:', payload.id);
        setNotifications(prev => {
          const updated = prev.map(n => (n.id === payload.id ? { ...n, ...payload } : n));
          setUnreadCount(updated.filter(n => !n.read_at).length);
          return updated;
        });
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Notifications] ✅ Realtime connected → ${channelName}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[Notifications] ❌ Channel error:', err);
          // Fallback: poll every 30 s
          const interval = setInterval(fetchNotifications, 30_000);
          channelRef.current = { unsubscribe: () => clearInterval(interval) };
        }
        if (status === 'TIMED_OUT') {
          console.warn('[Notifications] ⏳ Channel timed out — will retry automatically');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, isAdmin, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
