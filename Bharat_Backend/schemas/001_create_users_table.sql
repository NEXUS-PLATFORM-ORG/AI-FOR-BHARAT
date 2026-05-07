-- Migration: 001_create_auth_users_table.sql
-- Creates the users table for register/login flows and enables UUID functions.

-- 1. Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 2. Create the users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  password_hash TEXT, -- Nullable for OAuth users
  role TEXT CHECK (role IN ('reviewer','admin')) DEFAULT 'reviewer' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Add an index on email for quick lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4. (Optional) Insert a sample admin user
-- IMPORTANT: Replace with a real, strong password hash in a secure way.
-- This is for demonstration only.
-- To generate a hash, you can use a script or an online generator for bcrypt.
-- Example password: 'adminpassword'
-- Example hash: '$2a$10$Y.u2.y/Oa.CjL5YjZ3.fA.yM/E.t.U/I.jO.kL.zG.kL.zG.kL.zG'
INSERT INTO users (name, email, password_hash, role)
VALUES ('Admin User', 'admin@example.com', '$2a$10$fPLpCLLp9FE4aGzz3dCg9e/9ZUv12R0zV.Lz.jL.zG.kL.zG.kL.zG', 'admin')
ON CONFLICT (email) DO NOTHING;

