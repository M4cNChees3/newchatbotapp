-- Function to handle new user signup and automatically create an athlete profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.athletes (
    id, 
    email, 
    name, 
    age, 
    sport_type, 
    fitness_goal, 
    dietary_restrictions
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    (new.raw_user_meta_data->>'age')::integer,
    new.raw_user_meta_data->>'sport_type',
    new.raw_user_meta_data->>'fitness_goal',
    new.raw_user_meta_data->>'dietary_restrictions'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is created in auth.users
-- Drop if exists to avoid errors on redeployment
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
