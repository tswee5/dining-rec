-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically create default "Favorites" list for new users
CREATE OR REPLACE FUNCTION public.create_default_list()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.lists (user_id, name, is_default)
  VALUES (NEW.id, 'Favorites', TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default list when user is created
DROP TRIGGER IF EXISTS on_user_created ON public.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_list();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at on row updates
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_lists_updated_at ON public.lists;
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to prevent deletion of default lists
CREATE OR REPLACE FUNCTION public.prevent_default_list_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_default = TRUE THEN
    RAISE EXCEPTION 'Cannot delete default list';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent default list deletion
DROP TRIGGER IF EXISTS prevent_default_list_deletion ON public.lists;
CREATE TRIGGER prevent_default_list_deletion
  BEFORE DELETE ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_default_list_deletion();
