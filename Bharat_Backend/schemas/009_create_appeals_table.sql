-- Migration: 009_create_appeals_table.sql
-- Creates the appeals table for tracking appeal decisions separately from compliance
-- SAFE: New table, no impact on existing data

CREATE TABLE IF NOT EXISTS appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Appeal classification
  appeal_type TEXT CHECK (appeal_type IN ('regular_appeal', 'review_petition', 'special_leave_petition')),
  appeal_status TEXT DEFAULT 'pending' CHECK (appeal_status IN ('pending', 'filed', 'admitted', 'dismissed', 'allowed')),
  court_level TEXT,
  
  -- Deadline calculation
  limitation_days INTEGER,
  decision_date DATE,
  calculated_deadline DATE,
  actual_filing_date DATE,
  
  -- Assignment
  assigned_officer TEXT,
  assigned_department TEXT,
  
  -- Appeal details
  appeal_grounds TEXT,
  stay_application_filed BOOLEAN DEFAULT false,
  stay_granted BOOLEAN DEFAULT false,
  stay_order_date DATE,
  notes TEXT,
  
  -- Audit fields
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_appeals_case_id ON appeals(case_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(appeal_status);
CREATE INDEX IF NOT EXISTS idx_appeals_deadline ON appeals(calculated_deadline);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appeals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_appeals_updated_at
  BEFORE UPDATE ON appeals
  FOR EACH ROW
  EXECUTE FUNCTION update_appeals_updated_at();
