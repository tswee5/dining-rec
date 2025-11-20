# TasteSwipe Deployment Guide

This guide covers deploying the TasteSwipe restaurant recommendation application to production.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works)
- Google Cloud Platform account with Places API enabled
- Anthropic API key (for Claude AI)
- Vercel account (for deployment) or another Next.js-compatible host

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Anthropic Claude AI
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Obtaining API Keys

#### Supabase
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Project Settings > API
3. Copy the Project URL and anon/public key
4. Copy the service_role key (keep this secret!)

#### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Places API (New)
   - Geocoding API
   - Maps JavaScript API
4. Create credentials (API Key)
5. Restrict the key to your domains for production

#### Anthropic API
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account and generate an API key
3. Note: Claude API usage is pay-as-you-go

## Database Setup

### 1. Initial Schema

Run the following migrations in your Supabase SQL Editor in order:

1. **001_initial_schema.sql** - Creates core tables (users, restaurants, user_interactions, user_preferences, etc.)
2. **002_rls_policies.sql** - Sets up Row Level Security policies
3. **003_add_lists.sql** - Adds saved lists functionality
4. **004_add_profile_enhancements.sql** - Adds enhanced profile fields and preference summaries

### 2. Running Migration 004 (Latest)

Since the Supabase CLI is not linked to this project, run migrations manually:

#### Option 1: Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy the entire contents of `supabase/migrations/004_add_profile_enhancements.sql`
5. Paste into the SQL editor
6. Click **Run** to execute

#### Option 2: Direct SQL Connection

If you have direct database access:

```bash
psql YOUR_DATABASE_URL < supabase/migrations/004_add_profile_enhancements.sql
```

### 3. Verify Migration

Run this query in the Supabase SQL Editor to verify:

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

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 4. Test Features

1. **Authentication**: Sign up/login via Supabase Auth
2. **Profile Setup**: First-run modal should appear for new users
3. **Restaurant Search**: Search for restaurants in a city
4. **AI Recommendations**: Click "AI Recommendations" button
5. **Chat Interface**: Use the chat dock at the bottom to refine searches
6. **Interactions**: Like, save, or pass on restaurants
7. **Lists**: Create and manage saved restaurant lists

## Production Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your_github_repo_url
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables in Vercel dashboard:
   - Add all variables from `.env.local`
   - Make sure to add them to **all environments** (Production, Preview, Development)
5. Click "Deploy"

### 3. Configure Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Enable automatic HTTPS

### 4. Environment Variables in Vercel

**Required for Production:**

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
GOOGLE_MAPS_API_KEY
ANTHROPIC_API_KEY
```

**Important:** Update your Supabase Authentication settings:
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your Vercel domain to "Site URL"
3. Add `https://your-domain.vercel.app/**` to "Redirect URLs"

## Post-Deployment Verification

### 1. Check Application Health

- [ ] Homepage loads correctly
- [ ] Authentication flow works (sign up, login, logout)
- [ ] Profile initialization modal appears for new users
- [ ] Restaurant search returns results
- [ ] AI recommendations work
- [ ] Chat interface responds to queries
- [ ] User interactions save correctly
- [ ] Lists can be created and managed

### 2. Monitor API Usage

- **Supabase**: Check database usage in dashboard
- **Google Maps**: Monitor quota in Google Cloud Console
- **Anthropic**: Track token usage in Anthropic console

### 3. Check Logs

Vercel:
```bash
vercel logs your-project-name
```

Or view logs in Vercel Dashboard > Deployments > [Your Deployment] > Logs

Supabase:
- Go to Supabase Dashboard > Logs
- Check for errors in Database, Auth, and Storage logs

## Troubleshooting

### Issue: Authentication doesn't work

**Solution:**
- Verify Supabase URL and keys are correct in environment variables
- Check that your deployment domain is added to Supabase redirect URLs
- Clear browser cookies and try again

### Issue: Google Places API returns no results

**Solution:**
- Verify API key is enabled for Places API (New)
- Check API key restrictions aren't blocking requests
- Ensure billing is enabled on Google Cloud project
- Review quota limits in Google Cloud Console

### Issue: AI Recommendations fail

**Solution:**
- Verify Anthropic API key is valid
- Check API usage hasn't exceeded quota
- Review error logs for specific Claude API errors
- Ensure user has interactions (likes/saves) in database

### Issue: Database migration fails

**Solution:**
- Check if tables already exist (migrations may have run before)
- Review Supabase database logs for specific errors
- Try running migrations one at a time
- Use the rollback scripts in `supabase/migrations/MIGRATION_INSTRUCTIONS.md` if needed

### Issue: ProfileInitModal doesn't appear

**Solution:**
- Check that user_preferences table exists
- Verify RLS policies allow user to read/write their preferences
- Check browser console for errors
- Try clearing user preferences for testing:
  ```sql
  DELETE FROM user_preferences WHERE user_id = 'your_user_id';
  ```

### Issue: Chat components throw module errors

**Solution:**
- Verify imports use `@/lib/utils` not `./ui/utils`
- Clear Next.js cache: `rm -rf .next`
- Restart development server
- Check that all ShadCN components are installed

## Maintenance

### Database Backups

Supabase automatically backs up your database daily. To manually backup:

1. Go to Supabase Dashboard > Database > Backups
2. Click "Create Backup"
3. Download backup file for local storage

### Updating Dependencies

```bash
npm outdated  # Check for outdated packages
npm update    # Update to latest compatible versions
npm audit fix # Fix security vulnerabilities
```

### Monitoring Performance

1. **Vercel Analytics**: Enable in Project Settings > Analytics
2. **Supabase Performance**: Monitor query performance in Database dashboard
3. **Claude API**: Track token usage and response times
4. **Google Maps API**: Monitor quota and costs

## Security Best Practices

1. **Never commit** `.env.local` or API keys to version control
2. **Rotate API keys** periodically (every 3-6 months)
3. **Use RLS policies** to secure Supabase data
4. **Restrict API keys** to specific domains in production
5. **Monitor logs** for suspicious activity
6. **Keep dependencies updated** to patch security vulnerabilities
7. **Use service role key** only in server-side code (never expose to client)

## Cost Estimates

### Free Tier Limits (Approximate)

- **Vercel**: 100GB bandwidth, unlimited sites
- **Supabase**: 500MB database, 50K monthly active users
- **Google Maps API**: $200/month free credit (~28K requests)
- **Anthropic Claude**: No free tier (pay-as-you-go, ~$0.003 per request)

### Expected Monthly Costs (for ~1000 active users)

- **Vercel**: $0 (within free tier)
- **Supabase**: $0-25 (may need Pro plan for scaling)
- **Google Maps API**: $0-50 (within free credit)
- **Anthropic Claude**: $30-100 (depends on recommendation usage)

**Total**: ~$30-175/month for 1000 active users

## Support

For issues or questions:
- Check this deployment guide
- Review `supabase/migrations/MIGRATION_INSTRUCTIONS.md`
- Check application logs (Vercel, Supabase)
- Review API documentation (Google, Anthropic, Supabase)
