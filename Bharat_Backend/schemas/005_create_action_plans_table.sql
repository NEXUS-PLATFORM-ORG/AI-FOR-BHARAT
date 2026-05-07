-- Migration: 005_create_action_plans_table.sql

CREATE TABLE IF NOT EXISTS action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  status VARCHAR(50),
  priority VARCHAR(50),
  summary_directive TEXT,
  departments_involved JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS action_plan_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_plan_id UUID REFERENCES action_plans(id) ON DELETE CASCADE,
  step INTEGER,
  description TEXT,
  assigned_to VARCHAR(100),
  is_mandatory BOOLEAN DEFAULT false,
  deadline_offset_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Note: Apply this migration in your Supabase dashboard SQL editor.