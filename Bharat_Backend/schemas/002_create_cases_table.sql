-- Migration: 002_create_cases_table.sql
-- Creates the cases table to store extracted PDF metadata and file URLs.

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id VARCHAR(255),
  department VARCHAR(255),
  court VARCHAR(255),
  deadline TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(50) DEFAULT 'Medium',
  status VARCHAR(100) DEFAULT 'PENDING REVIEW',
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Note: Ensure the "uploads" bucket is set to PUBLIC in the Supabase dashboard
-- so that file_url can be directly accessed by the frontend.
