# Database Migration Instructions

## How to Run Migration 004

Since the Supabase CLI is not linked to this project, run the migration manually:

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy the entire contents of `004_add_profile_enhancements.sql`
5. Paste into the SQL editor
6. Click **Run** to execute

### Option 2: Direct SQL Connection

If you have direct database access:

```bash
psql YOUR_DATABASE_URL < supabase/migrations/004_add_profile_enhancements.sql
```

## What This Migration Does

1. **Adds new columns to `user_preferences` table**:
   - `age_range` (TEXT) - User's age range
   - `neighborhood` (TEXT) - Preferred neighborhood
   - `dining_frequency` (TEXT) - How often user dines out
   - `typical_spend` (TEXT) - Typical spending per person

2. **Creates `preference_summaries` table**:
   - Stores aggregated user preference insights
   - Used for efficient LLM context in recommendations
   - Auto-updates timestamp on changes

3. **Extends `restaurants` table**:
   - `website` (TEXT) - Restaurant website URL
   - `maps_url` (TEXT) - Google Maps URL
   - `photo_references` (TEXT[]) - Array of photo reference IDs

4. **Sets up Row Level Security (RLS)**:
   - Enables RLS on `preference_summaries`
   - Users can only access their own summaries
   - Full CRUD permissions for own data

## Verification

After running the migration, verify in Supabase SQL Editor:

```sql
-- Check new columns in user_preferences
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_preferences'
  AND column_name IN ('age_range', 'neighborhood', 'dining_frequency', 'typical_spend');

-- Check preference_summaries table exists
SELECT * FROM preference_summaries LIMIT 0;

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE tablename = 'preference_summaries';
```

## Rollback (If Needed)

```sql
-- Remove new columns from user_preferences
ALTER TABLE public.user_preferences
DROP COLUMN IF EXISTS age_range,
DROP COLUMN IF EXISTS neighborhood,
DROP COLUMN IF EXISTS dining_frequency,
DROP COLUMN IF EXISTS typical_spend;

-- Drop preference_summaries table
DROP TABLE IF EXISTS public.preference_summaries CASCADE;

-- Revert restaurants table changes
ALTER TABLE public.restaurants
DROP COLUMN IF EXISTS website,
DROP COLUMN IF EXISTS maps_url,
DROP COLUMN IF EXISTS photo_references;
```
