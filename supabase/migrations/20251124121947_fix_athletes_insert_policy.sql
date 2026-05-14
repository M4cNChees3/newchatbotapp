/*
  # Fix Athletes Insert Policy for Sign Up

  1. Changes
    - Drop the existing insert policy that only allows authenticated users
    - Create new insert policy that allows both authenticated and anon users to insert their own profile
    - This fixes the "fetch failed" error during sign up where new users couldn't create their athlete profile
  
  2. Security
    - Policy still validates that user can only insert their own profile (id = auth.uid())
    - Maintains data security while allowing sign up flow to work correctly
*/

-- Drop existing restrictive insert policy
DROP POLICY IF EXISTS "Athletes can insert own profile" ON athletes;

-- Create new insert policy that works for sign up (allows anon role during registration)
CREATE POLICY "Athletes can insert own profile"
  ON athletes
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (id = auth.uid());
