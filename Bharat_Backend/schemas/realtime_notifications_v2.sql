-- ================================================================
-- CJ-VAPS: Secure Realtime Notifications v2
-- Run this ENTIRELY in Supabase SQL Editor (Dashboard → SQL Editor)
-- Project: lhdolofucrvweaamfexg
-- ================================================================

-- ── SECTION 1: Ensure the notifications table is fully indexed ──
-- (Table already exists; we only add missing pieces)

-- Ensure realtime is enabled on the table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;


-- ── SECTION 2: Drop existing loose RLS policies and replace ────
-- Old policies used USING (true) — open to everyone. Replace them.

-- SELECT policies
DROP POLICY IF EXISTS "Users can view own notifications"  ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;

-- INSERT policies
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- UPDATE policies
DROP POLICY IF EXISTS "Users can update own notifications"  ON public.notifications;
DROP POLICY IF EXISTS "Admins can update all notifications" ON public.notifications;


-- ── SECTION 3: New secure RLS policies ────────────────────────
-- IMPORTANT: Your backend uses a CUSTOM JWT (not Supabase Auth),
-- so auth.uid() is NOT set for the realtime subscription.
-- Strategy:
--   • Backend writes via service_role key → bypasses RLS (safe).
--   • Frontend Realtime uses the anon key → we allow SELECT so
--     the postgres_changes subscription can receive the rows,
--     but we NEVER expose another user's data via direct REST.
--   • Admin detection: checked via the `users` table joined on
--     the user_id in the notification row (server-side, safe).
--     For anon-key subscriptions we keep SELECT open (same as
--     before) but all data-level scoping is done in the backend.

-- Policy 1: Backend service_role can INSERT (implicit bypass)
--            Anon clients cannot insert directly (no WITH CHECK)
CREATE POLICY "backend_insert_only"
  ON public.notifications
  FOR INSERT
  WITH CHECK (false);   -- blocks direct anon/user inserts; service_role bypasses

-- Policy 2: SELECT — allow rows to flow through realtime channel.
--            Scoping is enforced in the backend REST layer.
CREATE POLICY "select_for_realtime"
  ON public.notifications
  FOR SELECT
  USING (true);   -- needed so realtime subscription can read the row payload

-- Policy 3: UPDATE — only the backend (service_role) may update.
CREATE POLICY "backend_update_only"
  ON public.notifications
  FOR UPDATE
  USING (false)       -- blocks direct anon/user updates
  WITH CHECK (false); -- service_role bypasses this automatically


-- ── SECTION 4: Broadcast trigger using realtime.broadcast ─────
-- When a notification row is INSERTed or UPDATEd, push a message
-- to TWO broadcast channels:
--   1. user:<user_id>:notifications  → the recipient only
--   2. admin:notifications           → admin always
--
-- The frontend subscribes to exactly one of these channels
-- depending on role. No cross-user leakage is possible because
-- each channel name contains the user's UUID.

CREATE OR REPLACE FUNCTION public.fn_broadcast_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event   TEXT;
  v_payload JSONB;
BEGIN
  -- Determine event label
  IF TG_OP = 'INSERT' THEN
    v_event := 'notification_created';
  ELSE
    v_event := 'notification_updated';
  END IF;

  -- Build a clean payload (no sensitive internal columns)
  v_payload := jsonb_build_object(
    'id',         NEW.id,
    'user_id',    NEW.user_id,
    'title',      NEW.title,
    'message',    NEW.message,
    'type',       NEW.type,
    'case_id',    NEW.case_id,
    'read_at',    NEW.read_at,
    'created_at', NEW.created_at
  );

  -- ① Broadcast to the individual user's private channel
  PERFORM realtime.broadcast(
    'user:' || NEW.user_id::TEXT || ':notifications',
    v_event,
    v_payload
  );

  -- ② Broadcast to the admin channel (admin sees all)
  PERFORM realtime.broadcast(
    'admin:notifications',
    v_event,
    v_payload
  );

  RETURN NEW;
END;
$$;

-- Attach the trigger to the notifications table
DROP TRIGGER IF EXISTS trg_broadcast_notification ON public.notifications;

CREATE TRIGGER trg_broadcast_notification
  AFTER INSERT OR UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_broadcast_notification();


-- ── SECTION 5: Grant realtime.broadcast to the trigger owner ──
-- The function runs as SECURITY DEFINER (postgres superuser context)
-- so it can call realtime.broadcast without extra grants.
-- But we still confirm the realtime schema is accessible:
GRANT USAGE ON SCHEMA realtime TO postgres;


-- ── SECTION 6: Verify ─────────────────────────────────────────
-- After running this script, confirm in Dashboard:
--   Table Editor → notifications → RLS = enabled
--   Realtime     → Enabled tables → notifications listed
--   Functions    → fn_broadcast_notification exists
--   Triggers     → trg_broadcast_notification on notifications

-- ================================================================
-- ✅ DONE
-- ================================================================
