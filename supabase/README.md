# Supabase Database Setup

This directory contains all the SQL migration files needed to set up the TasteSwipe database.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys

## Running Migrations

You have two options to run these migrations:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Run each migration file in order:
   - `001_create_tables.sql`
   - `002_enable_rls.sql`
   - `003_create_functions_triggers.sql`
4. Copy and paste the contents of each file and click **Run**

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Migration Files

### 001_create_tables.sql
Creates all database tables:
- `users` - User accounts (extends auth.users)
- `user_preferences` - User onboarding preferences
- `user_interactions` - Restaurant interactions (like, pass, save, etc.)
- `restaurants` - Cached Google Places data
- `lists` - User-created restaurant lists
- `list_restaurants` - Junction table for lists and restaurants

Also creates indexes for optimal query performance.

### 002_enable_rls.sql
Enables Row Level Security (RLS) on all tables and creates security policies to ensure:
- Users can only access their own data
- Restaurant cache data is readable by all authenticated users
- Default "Favorites" list cannot be deleted

### 003_create_functions_triggers.sql
Creates database functions and triggers:
- Automatically creates user profile when signing up via Supabase Auth
- Auto-creates default "Favorites" list for new users
- Updates `updated_at` timestamps on row changes
- Prevents deletion of default lists

## After Running Migrations

1. Update your `.env.local` file with Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

2. Test the setup by creating a test user through Supabase Auth
3. Verify that the `users` table and default `lists` entry are created automatically

## Troubleshooting

- If you get permission errors, make sure RLS is enabled and policies are created
- If triggers don't fire, check that the functions are created with `SECURITY DEFINER`
- For any UUID errors, ensure the `uuid-ossp` extension is enabled

## Database Schema Diagram

```
auth.users (Supabase managed)
    ↓
users (id, email, timestamps)
    ↓
    ├── user_preferences (cuisines, price, distance, vibes)
    ├── user_interactions (place_id, action, metadata)
    └── lists (name, is_default)
            ↓
        list_restaurants (list_id, place_id)

restaurants (place_id, data JSONB, cached_at)
```
