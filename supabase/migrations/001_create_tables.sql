-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  default_city TEXT NOT NULL,
  preferred_cuisines TEXT[] DEFAULT '{}',
  price_range INTEGER[] DEFAULT '{1,2,3,4}',
  max_distance FLOAT DEFAULT 10.0,
  vibe_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User interactions table
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass', 'maybe', 'save', 'open')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Restaurants cache table
CREATE TABLE IF NOT EXISTS public.restaurants (
  place_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Lists table
CREATE TABLE IF NOT EXISTS public.lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name)
);

-- List restaurants junction table
CREATE TABLE IF NOT EXISTS public.list_restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(list_id, place_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id_created_at ON public.user_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id_action ON public.user_interactions(user_id, action);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id_place_id ON public.user_interactions(user_id, place_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_cached_at ON public.restaurants(cached_at);
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON public.lists(user_id);
CREATE INDEX IF NOT EXISTS idx_list_restaurants_list_id ON public.list_restaurants(list_id);
CREATE INDEX IF NOT EXISTS idx_list_restaurants_place_id ON public.list_restaurants(place_id);
