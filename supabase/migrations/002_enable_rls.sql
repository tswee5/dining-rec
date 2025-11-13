-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_restaurants ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- User interactions policies
CREATE POLICY "Users can view own interactions"
  ON public.user_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions"
  ON public.user_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactions"
  ON public.user_interactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions"
  ON public.user_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- Restaurants table policies (public read access)
CREATE POLICY "Anyone can view restaurants"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (true);

-- Lists table policies
CREATE POLICY "Users can view own lists"
  ON public.lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lists"
  ON public.lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lists"
  ON public.lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lists"
  ON public.lists FOR DELETE
  USING (auth.uid() = user_id AND is_default = FALSE);

-- List restaurants policies
CREATE POLICY "Users can view restaurants in own lists"
  ON public.list_restaurants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lists
      WHERE lists.id = list_restaurants.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add restaurants to own lists"
  ON public.list_restaurants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lists
      WHERE lists.id = list_restaurants.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove restaurants from own lists"
  ON public.list_restaurants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lists
      WHERE lists.id = list_restaurants.list_id
      AND lists.user_id = auth.uid()
    )
  );
