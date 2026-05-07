-- Migration: 004_create_extractions_table.sql
-- Creates the extractions table to store AI extracted data separately from the cases table.

CREATE TABLE IF NOT EXISTS extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  raw_pdf_text TEXT,
  extracted_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Note: Apply this migration in your Supabase dashboard SQL editor.