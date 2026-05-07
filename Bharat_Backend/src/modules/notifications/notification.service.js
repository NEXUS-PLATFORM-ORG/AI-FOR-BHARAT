import supabase from '../../config/supabaseAdmin.js';

/**
 * Create a notification for a specific user.
 * Called from existing backend flows (case upload, status change, etc.)
 *
 * @param {Object} params
 * @param {string} params.user_id  - Recipient user ID (from public.users)
 * @param {string} params.title    - Notification title
 * @param {string} params.message  - Notification body
 * @param {string} [params.type]   - Notification type (case_created, status_change, ai_complete, system)
 * @param {string} [params.case_id] - Related case UUID (optional)
 */
export const createNotification = async ({ user_id, title, message, type = 'system', case_id = null }) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ user_id, title, message, type, case_id }])
    .select()
    .single();

  if (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }

  return data;
};

/**
 * Create notifications for ALL users (broadcast-style).
 * Useful for system-wide announcements or notifying all reviewers.
 *
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.type]
 * @param {string} [params.case_id]
 * @param {string} [params.role] - Optional role filter (e.g., 'reviewer', 'admin')
 */
export const notifyAllUsers = async ({ title, message, type = 'system', case_id = null, role = null }) => {
  try {
    // Fetch target users
    let query = supabase.from('users').select('id');
    if (role) {
      if (Array.isArray(role)) {
        query = query.in('role', role);
      } else {
        query = query.eq('role', role);
      }
    }

    const { data: users, error: userError } = await query;
    if (userError || !users || users.length === 0) {
      console.warn('No users found to notify');
      return [];
    }

    // Batch insert notifications for all users
    const notifications = users.map(u => ({
      user_id: u.id,
      title,
      message,
      type,
      case_id,
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      console.error('Failed to create bulk notifications:', error.message);
      return [];
    }

    return data;
  } catch (err) {
    console.error('notifyAllUsers error:', err.message);
    return [];
  }
};

/**
 * Get all notifications for a user (used by the REST endpoint).
 */
export const getNotificationsForUser = async (userId, limit = 50) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch notifications:', error.message);
    return [];
  }

  return data;
};

/**
 * Get ALL notifications across all users (for admin view).
 * Admins need to see every action taken in the system.
 */
export const getAllNotifications = async (limit = 100) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch all notifications:', error.message);
    return [];
  }

  return data;
};

/**
 * Mark a notification as read.
 */
export const markAsRead = async (notificationId, userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Failed to mark notification as read:', error.message);
    return null;
  }

  return data;
};

/**
 * Mark all notifications as read for a user.
 */
export const markAllAsRead = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)
    .select();

  if (error) {
    console.error('Failed to mark all as read:', error.message);
    return [];
  }

  return data;
};
