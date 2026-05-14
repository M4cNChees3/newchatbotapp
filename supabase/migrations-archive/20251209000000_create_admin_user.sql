-- Create a new admin user (replace placeholder values)
-- Note: This creates the user in auth.users AND the public.athletes profile
-- You MUST replace 'admin@example.com' and 'your-secure-password' with actual values

-- 1. Create user in auth.users (if not exists)
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'admin@example.com';
  
  IF new_user_id IS NULL THEN
    -- Generate new UUID
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      crypt('your-secure-password', gen_salt('bf')), -- Password hashing
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      'authenticated',
      'authenticated',
      ''
    );
    
    -- Insert into identities (required for auth to work properly)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id, 'admin@example.com')::jsonb,
      'email',
      new_user_id,
      now(),
      now(),
      now()
    );
  END IF;

  -- 2. Create or update profile in public.athletes with 'admin' role
  INSERT INTO public.athletes (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'admin@example.com',
    'System Admin',
    'admin',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = now();

END $$;
