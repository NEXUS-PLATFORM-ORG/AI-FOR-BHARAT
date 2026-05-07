-- Migration: 006_alter_cases_compliance_columns.sql
-- Adds compliance tracking columns to the cases table.
-- SAFE: Only adds new columns. All existing columns and data are untouched.

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS compliance_decision  TEXT CHECK (compliance_decision IN ('comply', 'appeal', 'pending')),
  ADD COLUMN IF NOT EXISTS compliance_status    TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS assigned_officer     TEXT,
  ADD COLUMN IF NOT EXISTS assigned_department  TEXT,
  ADD COLUMN IF NOT EXISTS compliance_deadline  DATE,
  ADD COLUMN IF NOT EXISTS compliance_notes     TEXT,
  ADD COLUMN IF NOT EXISTS decided_by           UUID,
  ADD COLUMN IF NOT EXISTS decided_at           TIMESTAMPTZ;

-- Also adds columns required by the upload route AI extraction
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS case_number    TEXT,
  ADD COLUMN IF NOT EXISTS judge          TEXT,
  ADD COLUMN IF NOT EXISTS petitioner     TEXT,
  ADD COLUMN IF NOT EXISTS decision_date  TIMESTAMPTZ;
