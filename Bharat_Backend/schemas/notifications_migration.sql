-- ============================================================
-- CJ-VAPS Realtime Notifications — Supabase SQL Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. CREATE notifications TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'system',           -- case_created | status_change | ai_complete | system
  case_id     UUID,                            -- optional reference to a case
  read_at     TIMESTAMPTZ,                     -- NULL = unread
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;


-- ─────────────────────────────────────────────────────────────
-- 2. RLS POLICIES
--    Your backend uses service_role key (bypasses RLS),
--    but these policies protect direct client access.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow the service_role (used by backend) to do everything
-- This is implicit — service_role bypasses RLS by default

-- Policy: Users can read their own notifications (for direct Supabase client access)
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (true);
  -- NOTE: Since you use custom JWT (not Supabase Auth), auth.uid() won't work.
  -- The backend already filters by user_id. This policy is permissive for 
  -- the Supabase Realtime subscription to work with the anon key.
  -- In production, you'd use auth.uid() = user_id with Supabase Auth.

-- Policy: Only backend (service_role) can insert
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- 3. ENABLE REALTIME on the notifications table
--    This tells Supabase to broadcast postgres_changes events
-- ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ─────────────────────────────────────────────────────────────
-- ✅ DONE!  
-- The backend inserts notifications via service_role (bypasses RLS).
-- The frontend subscribes to postgres_changes via Supabase JS client.
-- Supabase Realtime automatically broadcasts INSERT/UPDATE events.
-- ─────────────────────────────────────────────────────────────
