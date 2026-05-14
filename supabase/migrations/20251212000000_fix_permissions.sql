-- Fix permissions for the public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Ensure search path is correct
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Trigger schema cache reload
NOTIFY pgrst, 'reload schema';
