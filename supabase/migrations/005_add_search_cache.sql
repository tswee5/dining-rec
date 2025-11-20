-- Migration: Add search_cache table for caching search results
-- This table stores full search results to avoid duplicate API calls

CREATE TABLE IF NOT EXISTS public.search_cache (
  cache_key TEXT PRIMARY KEY,
  results JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient cache expiration queries
CREATE INDEX IF NOT EXISTS idx_search_cache_cached_at ON public.search_cache(cached_at);

-- Add comment for documentation
COMMENT ON TABLE public.search_cache IS 'Caches Google Places API search results to reduce API calls. TTL: 1 hour';

