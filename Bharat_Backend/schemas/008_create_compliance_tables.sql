-- Migration: 008_create_compliance_tables.sql
-- Creates two brand new tables for compliance tracking.
-- SAFE: Nothing existing is touched. These are completely new tables.

-- Compliance Checklist
-- Stores per-case action items, both system-generated and manually added.
CREATE TABLE IF NOT EXISTS compliance_checklist (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id          UUID REFERENCES cases(id) ON DELETE CASCADE,
  action_plan_id   UUID REFERENCES action_plans(id) ON DELETE SET NULL,
  item_title       TEXT NOT NULL,
  item_description TEXT,
  assigned_to      TEXT,
  target_days      INTEGER,
  target_date      DATE,
  is_mandatory     BOOLEAN DEFAULT false,
  is_completed     BOOLEAN DEFAULT false,
  completed_by     UUID,
  completed_at     TIMESTAMPTZ,
  completion_notes TEXT,
  source           TEXT DEFAULT 'manual'
                   CHECK (source IN ('system_generated', 'manual'))
);

-- Compliance Audit Log
-- Tracks every compliance action taken on a case for accountability.
CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id        UUID REFERENCES cases(id) ON DELETE CASCADE,
  action_type    TEXT,
  performed_by   UUID,
  performed_at   TIMESTAMPTZ DEFAULT now(),
  previous_value JSONB,
  new_value      JSONB,
  notes          TEXT
);
