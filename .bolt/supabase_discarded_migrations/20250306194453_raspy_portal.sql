/*
  # Fix profiles registration policies

  1. Security Changes
    - Allow profile creation during registration
    - Maintain security for profile updates
    - Keep public read access

  2. Changes
    - Remove authenticated requirement for profile creation
    - Use special policy for registration flow
    - Keep existing read and update policies
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
TO public
USING (true);

-- Allow profile creation during registration
CREATE POLICY "Allow profile creation during registration"
ON profiles
FOR INSERT
TO public
WITH CHECK (true);

-- Restrict profile updates to owner
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);