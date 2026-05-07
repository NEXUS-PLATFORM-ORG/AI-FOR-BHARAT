-- Migration: 010_create_appeal_checklist_table.sql
-- Creates the appeal_checklist table for tracking appeal action items
-- SAFE: New table, no impact on existing data

CREATE TABLE IF NOT EXISTS appeal_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appeal_id UUID NOT NULL REFERENCES appeals(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Item details
  item_title TEXT NOT NULL,
  item_description TEXT,
  assigned_to TEXT,
  
  -- Timeline
  target_days INTEGER,
  target_date DATE,
  
  -- Status
  is_mandatory BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  completed_by UUID,
  completed_at TIMESTAMPTZ,
  
  -- Source tracking
  source TEXT DEFAULT 'system_generated' CHECK (source IN ('system_generated', 'manual')),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appeal_checklist_appeal_id ON appeal_checklist(appeal_id);
CREATE INDEX IF NOT EXISTS idx_appeal_checklist_case_id ON appeal_checklist(case_id);
CREATE INDEX IF NOT EXISTS idx_appeal_checklist_completed ON appeal_checklist(is_completed);
