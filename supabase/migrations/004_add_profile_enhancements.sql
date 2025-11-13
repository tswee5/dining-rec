-- Add new profile fields to user_preferences table
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS dining_frequency TEXT,
ADD COLUMN IF NOT EXISTS typical_spend TEXT;

-- Create preference summaries table for efficient LLM context
CREATE TABLE IF NOT EXISTS public.preference_summaries (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for preference summaries
CREATE INDEX IF NOT EXISTS idx_preference_summaries_updated_at ON public.preference_summaries(updated_at);

-- Extend restaurants table to store additional data
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS maps_url TEXT,
ADD COLUMN IF NOT EXISTS photo_references TEXT[];

-- Update timestamp function for preference_summaries
CREATE OR REPLACE FUNCTION update_preference_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_preference_summaries_updated_at
  BEFORE UPDATE ON public.preference_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_preference_summaries_updated_at();
