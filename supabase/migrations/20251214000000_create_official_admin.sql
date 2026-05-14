-- Create a new official admin user
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- 1. Insert into auth.users
  -- Note: We use extensions.crypt and extensions.gen_salt
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
    'adminnahel@gmail.com',
    extensions.crypt('Qwerty345', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name": "Admin Nahel"}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    ''
  ) ON CONFLICT (email) DO NOTHING;

  -- Get the actual ID if it already existed
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'adminnahel@gmail.com';

  -- 2. Insert into auth.identities
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
    format('{"sub":"%s","email":"%s"}', new_user_id, 'adminnahel@gmail.com')::jsonb,
    'email',
    new_user_id,
    now(),
    now(),
    now()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- 3. Create or update profile in public.athletes with 'admin' role
  INSERT INTO public.athletes (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'adminnahel@gmail.com',
    'Admin Nahel',
    'admin',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = now();

END $$;
