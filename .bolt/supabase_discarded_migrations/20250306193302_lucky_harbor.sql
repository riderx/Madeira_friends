/*
  # Add test account

  1. Changes
    - Creates a test user account with email test@example.com and password 'testpass123'
    - Adds corresponding profile with admin role
    
  2. Security
    - Account is created with email verification disabled
    - Profile has admin role for testing all features
*/

-- Create test user with Supabase auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_current,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'e5c0c7e8-5a6f-4657-8c47-8869cc9c3680',
  'authenticated',
  'authenticated',
  'test@example.com',
  '$2a$10$PxwWH.DvpVgGzxb2S6G5E.H7jJoJ1.eqQCvRC.EEVkgqCGQVvLNGi', -- This is 'testpass123'
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create corresponding profile
INSERT INTO public.profiles (
  id,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  'e5c0c7e8-5a6f-4657-8c47-8869cc9c3680',
  'Test User',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;