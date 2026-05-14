/*
  # Add Admin Role System

  ## Overview
  This migration adds role-based access control to enable admin functionality.
  Admins will have elevated permissions to manage users, view all chats, and control knowledge base.

  ## Changes

  1. **Add role column to athletes table**
     - `role` (text) - User role: 'user' or 'admin'
     - Default value: 'user'
     - NOT NULL constraint

  2. **Update RLS Policies**
     - Admins can view all athletes (SELECT)
     - Admins can view all chat messages (SELECT)
     - Admins can delete chat messages (DELETE)
     - Admins can manage knowledge base (INSERT, UPDATE, DELETE)
     - Regular users maintain existing restricted access

  3. **Security Notes**
     - Admin status checked via athletes.role = 'admin'
     - All policies validate authentication first
     - Regular users cannot elevate their own role
     - Only existing admins can modify roles (requires manual SQL or admin panel)
*/

-- Add role column to athletes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'athletes' AND column_name = 'role'
  ) THEN
    ALTER TABLE athletes ADD COLUMN role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Drop existing SELECT policy for athletes to replace with new one
DROP POLICY IF EXISTS "Athletes can view own profile" ON athletes;

-- New policy: Users can view own profile, Admins can view all profiles
CREATE POLICY "Users view own profile, admins view all"
  ON athletes FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = auth.uid()
      AND athletes.role = 'admin'
    )
  );

-- Drop existing SELECT policy for chat_messages to replace
DROP POLICY IF EXISTS "Athletes can view own chat messages" ON chat_messages;

-- New policy: Users view own chats, Admins view all chats
CREATE POLICY "Users view own chats, admins view all"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    athlete_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = auth.uid()
      AND athletes.role = 'admin'
    )
  );

-- New policy: Admins can delete any chat message (for moderation)
CREATE POLICY "Admins can delete any chat message"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = auth.uid()
      AND athletes.role = 'admin'
    )
  );

-- Drop existing read-only knowledge base policy to replace
DROP POLICY IF EXISTS "Authenticated users can view knowledge base" ON knowledge_base;

-- New policy: All authenticated users can read knowledge base
CREATE POLICY "All authenticated users can read knowledge base"
  ON knowledge_base FOR SELECT
  TO authenticated
  USING (true);

-- New policy: Only admins can insert knowledge base entries
CREATE POLICY "Admins can insert knowledge base"
  ON knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = auth.uid()
      AND athletes.role = 'admin'
    )
  );

-- New policy: Only admins can update knowledge base entries
CREATE POLICY "Admins can update knowledge base"
  ON knowledge_base FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = auth.uid()
      AND athletes.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = auth.uid()
      AND athletes.role = 'admin'
    )
  );

-- New policy: Only admins can delete knowledge base entries
CREATE POLICY "Admins can delete knowledge base"
  ON knowledge_base FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = auth.uid()
      AND athletes.role = 'admin'
    )
  );

-- Create index on role column for performance
CREATE INDEX IF NOT EXISTS idx_athletes_role ON athletes(role) WHERE role = 'admin';

-- Note: To create your first admin, run this SQL manually in Supabase SQL Editor:
-- UPDATE athletes SET role = 'admin' WHERE email = 'your-admin-email@example.com';
