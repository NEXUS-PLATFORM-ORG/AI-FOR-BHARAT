import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import {
  getNotificationsForUser,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
} from './notification.service.js';
import supabase from '../../config/supabaseAdmin.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/v1/notifications
//   - Admin  → returns ALL notifications from the entire system
//   - Others → returns notifications addressed to the logged-in user
// ─────────────────────────────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.user;

    let notifications;
    if (role === 'admin') {
      // Admins see every notification regardless of recipient
      notifications = await getAllNotifications();
    } else {
      notifications = await getNotificationsForUser(userId);
    }

    res.json({ notifications });
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/notifications/read-all — mark all as read
//   Must be declared BEFORE /:id/read to avoid route collision
// ─────────────────────────────────────────────────────────────
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role === 'admin') {
      // Mark ALL unread notifications as read (system-wide for admin)
      const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null)
        .select();

      if (error) throw error;
      return res.json({ message: 'All notifications marked as read', count: data?.length ?? 0 });
    }

    const notifications = await markAllAsRead(userId);
    res.json({ message: 'All notifications marked as read', count: notifications.length });
  } catch (error) {
    console.error('Mark All Read Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/notifications/:id/read — mark a single notification as read
// ─────────────────────────────────────────────────────────────
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role === 'admin') {
      // Admin can mark any notification as read regardless of owner
      const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      return res.json({ notification: data });
    }

    const notification = await markAsRead(req.params.id, userId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ notification });
  } catch (error) {
    console.error('Mark Read Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
