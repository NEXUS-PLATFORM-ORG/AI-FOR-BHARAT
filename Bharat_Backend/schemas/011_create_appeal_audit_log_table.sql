-- Migration: 011_create_appeal_audit_log_table.sql
-- Creates the appeal_audit_log table for tracking all appeal actions
-- SAFE: New table, no impact on existing data

CREATE TABLE IF NOT EXISTS appeal_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appeal_id UUID NOT NULL REFERENCES appeals(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Action tracking
  action_type TEXT NOT NULL CHECK (action_type IN (
    'appeal_initiated',
    'checklist_updated',
    'stay_filed',
    'stay_granted',
    'stay_rejected',
    'appeal_filed',
    'appeal_admitted',
    'appeal_dismissed',
    'appeal_allowed',
    'status_changed'
  )),
  
  -- Change tracking
  old_value JSONB,
  new_value JSONB,
  
  -- Audit
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_appeal_audit_appeal_id ON appeal_audit_log(appeal_id);
CREATE INDEX IF NOT EXISTS idx_appeal_audit_case_id ON appeal_audit_log(case_id);
CREATE INDEX IF NOT EXISTS idx_appeal_audit_action_type ON appeal_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_appeal_audit_performed_at ON appeal_audit_log(performed_at DESC);
