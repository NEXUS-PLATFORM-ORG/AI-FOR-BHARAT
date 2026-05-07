-- Migration: 007_alter_action_plans_new_columns.sql
-- Adds new compliance-facing columns to the action_plans table.
-- SAFE: Old columns (status, priority, summary_directive, departments_involved)
--       stay intact. Backend upload route keeps working without any change.
--       CompliancePage reads from the new columns.

ALTER TABLE action_plans
  ADD COLUMN IF NOT EXISTS directive_summary  TEXT,
  ADD COLUMN IF NOT EXISTS system_decision    TEXT,
  ADD COLUMN IF NOT EXISTS confidence_score   INTEGER,
  ADD COLUMN IF NOT EXISTS compliance_steps   JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS limitation_days    INTEGER;
