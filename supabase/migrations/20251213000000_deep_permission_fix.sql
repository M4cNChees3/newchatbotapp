-- Comprehensive permission and search path reset
-- This targets the internal roles used by Supabase API (PostgREST)

-- 1. Reset search path for all critical roles
ALTER ROLE authenticator SET search_path TO public, extensions, auth;
ALTER ROLE anon SET search_path TO public, extensions, auth;
ALTER ROLE authenticated SET search_path TO public, extensions, auth;
ALTER ROLE service_role SET search_path TO public, extensions, auth;

-- 2. Ensure the authenticator role (used by PostgREST) has usage on all schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, authenticator;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, authenticator;

-- 3. Grant explicit access to all tables in public to the API roles
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, authenticator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, authenticator;

-- 4. Reload the PostgREST schema cache
NOTIFY pgrst, 'reload schema';
