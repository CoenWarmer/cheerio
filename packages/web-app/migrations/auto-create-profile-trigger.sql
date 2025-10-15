-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, permissions)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE((NEW.raw_user_meta_data->>'permissions')::user_permission, 'supporter')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is inserted
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Create profiles for existing users who don't have one
INSERT INTO public.profiles (id, display_name, avatar_url, permissions)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', u.email) as display_name,
  COALESCE(u.raw_user_meta_data->>'avatar_url', NULL) as avatar_url,
  'supporter'::user_permission as permissions
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

