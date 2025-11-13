# 🧭 PRD: TasteSwipe – Personalized Restaurant Recommendation Web App

**Platform:** Web (Next.js + Supabase + Google Places API)
**Deployment:** Vercel
**Model:** LLM-based recommender using Claude API (3.5 Sonnet)
**UI Framework:** ShadCN + Tailwind + React Spring animations
**Maps:** @vis.gl/react-google-maps

---

## 🎯 Vision & Goal

TasteSwipe helps users discover restaurants tailored to their preferences through an engaging button-based interaction and map/list-driven experience.
Users can input dining preferences, interact with venues to train the system, view results on a map, and manage saved favorites and lists — all with a clean, modern, Airbnb-inspired design and smooth animations.

The MVP should:

* Fetch restaurant data from Google Places API (New Places API)
* Allow users to express preferences via:
  * Explicit inputs (List view filters + onboarding)
  * Button-based interactions on venues (Like, Pass, Maybe, Save)
* Persist interactions and preferences in Supabase
* Generate recommendations using Claude 3.5 Sonnet API
* Present recommendations across:
  * List view (20 per page with "Load More")
  * Map view
  * Profile (saved venues & lists)
* Mobile-first responsive design

---

## 🧠 Core User Flow

1. User signs up / logs in via Supabase Auth (email/password only for MVP).
2. **Onboarding flow**: collect basic preferences (cuisine, budget, max distance, vibe tags, city).
3. Main app layout uses a persistent bottom navigation with three tabs:
   * **List**
   * **Map**
   * **Profile**
4. In **List**:
   * User sets filters and sees relevant restaurants (20 at a time).
   * User can like / pass / maybe / save venues via button actions.
   * "Load More" button for pagination.
5. In **Map**:
   * User sees relevant venues plotted geographically.
6. In **Profile**:
   * User sees saved venues in "Favorites" list.
   * User can create custom lists and organize restaurants.
7. All interactions (likes, passes, maybes, saves, opens) are stored in Supabase.
8. When the user requests recommendations (after minimum 5 interactions):
   * Backend compiles a preference signal from stored data.
   * Sends context to Claude 3.5 Sonnet API.
   * Claude returns ~10 recommended restaurants (by name + meta).
   * Backend resolves names via Google Places API Text Search.
   * Frontend displays recommendations in list + map views.

---

## 🖥️ UX Requirements

### 📱 Bottom Navigation (Global)

A persistent **3-tab bottom navigation bar** present on all primary screens:

| Tab        | Icon Suggestion | Functionality                                                             |
| ---------- | --------------- | ------------------------------------------------------------------------- |
| 🍽 List    | List icon       | Preferences input + scrollable list of relevant / recommended restaurants |
| 🗺 Map     | Map pin icon    | Map with pins for relevant restaurants                                    |
| 👤 Profile | User icon       | Saved venues, custom lists, and account/profile management                |

* Tabs should have clear active/inactive states.
* Transitions between tabs should be smooth (React Spring: fade/slide).
* **Mobile-first responsive**: Bottom nav on mobile, side nav on tablet/desktop.

---

### 🍽 List View

**Purpose:** Core discovery surface combining preference inputs + card-based exploration.

**Layout:**

1. **Preferences Header / Filters**
   * Section title: "What are you craving?"
   * Inputs (ShadCN components):
     * City/Location (manual text input - required)
     * Cuisine (multi-select dropdown)
     * Price range ($–$$$$, checkboxes)
     * Distance (slider: 0.5mi - 25mi)
     * Rating minimum (dropdown: Any, 3+, 4+, 4.5+)
   * Primary CTA: **"Find Restaurants"**
     * Calls backend `/api/places/search` with filters.
     * Results populate list (first 20) + update map state.

2. **Restaurant Cards (Scrollable List, Paginated)**
   * Each card includes:
     * **1 photo** (Google Places photo reference)
     * Name
     * Cuisine / tags (from Google `types[]`)
     * Price level ($ symbols)
     * Rating (star display) + review count
     * Distance (calculated from city center or user input)
     * Address (shortened)
   * **Button Actions** (always visible, no swipe gestures):
     * ❤️ **Like** (green button)
     * 💭 **Maybe** (yellow button)
     * ❌ **Pass** (red button)
     * ⭐ **Save** (star icon - adds to "Favorites" list)
   * Every interaction is logged to `user_interactions` in Supabase.
   * **Interaction feedback**: Button press animation (React Spring scale), toast notification for saves.

3. **Pagination**
   * Show 20 restaurants per load.
   * "Load More" button at bottom (loads next 20).
   * Skeleton loaders while fetching.

4. **Recommendation Trigger**
   * Button: **"Get Smart Recommendations"**
     * **Enabled only after user has ≥5 interactions** (show tooltip if disabled).
     * Calls `/api/places/recommendations`.
     * Uses Claude 3.5 Sonnet with user history + preferences.
     * Replaces current list with ~10 recommended venues.
     * Loading state: Spinner + "Finding your perfect spots..."

**Error Handling:**
* If Google Places API fails: Show error toast, retry button.
* If no results: "No restaurants found. Try adjusting filters."

**UX Notes:**
* Use ShadCN cards, buttons, inputs, select, slider components.
* Smooth React Spring animations for:
  * Card hover states
  * Button press feedback
  * List loading (stagger fade-in)
* Skeleton loaders while fetching.

---

### 🗺 Map View

**Purpose:** Spatial exploration of relevant and recommended venues.

**Implementation:** `@vis.gl/react-google-maps`

**Behavior:**
* Shows a map centered on:
  * User's chosen city (geocoded to lat/lng on first search).
* Displays pins for:
  * Current set of restaurants from latest search or recommendation.
  * **No pin clustering in MVP** (add later if needed).
* **Pin colors**:
  * Default: Gray
  * Liked: Green
  * Maybe: Yellow
  * Saved: Gold star icon
* Clicking a pin:
  * Opens an **info window card** with:
    * Photo thumbnail
    * Name, rating, price, cuisine
    * Buttons: **Like**, **Save**, **View Details**, **Open in Google Maps**
  * "Open in Google Maps" deep links to `https://maps.google.com/?q=place_id:{place_id}`

**Dynamic Fetching:**
* **MVP: No dynamic fetching** on pan/zoom (keep it simple).
* Map shows only current result set from List view.

**UX Notes:**
* Keep styling consistent with Airbnb-style maps:
  * Clean pins, simple labels, white info windows.
* Smooth transitions:
  * Pan/zoom with default Google Maps easing.
* Map view reflects active filters from List view.

---

### 👤 Profile View

**Purpose:** User's personalized space for saved places and curated lists.

**Sections:**

1. **Favorites (Default List)**
   * All "saved" restaurants automatically go here.
   * Grid layout (mobile: 1 col, tablet: 2 col, desktop: 3 col).
   * Each card:
     * Photo, name, rating, cuisine tags
     * Buttons: **View on Map**, **Remove from Favorites**
     * Clicking card opens detail modal (see below).

2. **My Lists**
   * User can create **custom named lists**:
     * Examples: "Date Night", "Client Dinners", "Casual Spots".
   * Each list displays as an accordion or card with:
     * List name, restaurant count
     * Thumbnail preview of first 3 restaurants
   * Clicking a list expands to show all restaurants in that list.
   * **CRUD operations**:
     * **Create list**: Modal with text input for name
     * **Rename list**: Edit button → modal
     * **Delete list**: Confirm dialog
     * **Add restaurant to list**: From restaurant detail modal, multi-select lists
     * **Remove restaurant from list**: X button on card
   * **Restaurants can be in multiple lists** simultaneously.

3. **Preferences**
   * Display current saved preferences from onboarding.
   * **Edit button** to update:
     * Preferred cuisines, price range, max distance, vibe tags, default city.
   * Updates via `/api/user/preferences` PATCH.

4. **Account**
   * Display: Email (non-editable in MVP)
   * Actions:
     * **Change Password** (Supabase auth flow)
     * **Log Out**
     * **Delete Account** (GDPR-compliant: confirmation dialog, deletes all user data via cascade)

**Restaurant Detail Modal** (triggered from any card):
* Full-screen overlay (mobile) or centered modal (desktop).
* Content:
  * Photo gallery (up to 5 photos, carousel)
  * Name, rating, review count, price, cuisine
  * Address, phone, website (if available)
  * Opening hours (if available)
  * **Action buttons**:
    * Like / Pass / Maybe (if not already interacted)
    * Save to Favorites
    * Add to List (dropdown to select lists)
    * Open in Google Maps
  * Close button (X)

**UX Notes:**
* Use ShadCN cards, accordions, dialogs, modals, tabs.
* Aim for organized, minimal layout with clear visual hierarchy.

---

### 🎨 Onboarding Flow

**Trigger:** After successful sign-up, before accessing main app.

**Steps** (multi-step form, ~3 screens):

1. **Step 1: Location**
   * "Where do you want to find restaurants?"
   * Input: City name (text input with autocomplete via Google Places Autocomplete API)
   * Store as default city in `user_preferences.default_city`

2. **Step 2: Taste Preferences**
   * "What kind of food do you love?"
   * Multi-select cuisine options (Italian, Mexican, Japanese, Thai, Indian, American, Mediterranean, Chinese, etc.)
   * Price range checkboxes ($, $$, $$$, $$$$)
   * Max distance slider (0.5mi - 25mi)

3. **Step 3: Vibe & Finish**
   * "What vibe are you looking for?" (optional)
   * Tag buttons: Romantic, Casual, Trendy, Family-friendly, Quiet, Lively, Outdoor seating, etc.
   * CTA: **"Start Exploring"**

**Data Storage:**
* All responses saved to `user_preferences` table.
* After completion, redirect to `/app/list`.

**Skip Option:**
* Allow users to skip onboarding (button: "I'll set this later").
* If skipped, show empty state in List view prompting to set preferences.

---

## ✨ Visual & Interaction Design

* **Inspiration:** Airbnb web/mobile:
  * Lots of white space, rounded corners, soft shadows.
  * Clear typography (sans-serif, readable hierarchy).
  * Iconography: Lucide React or Heroicons.
* **Components:** Use ShadCN for:
  * Navigation, buttons, inputs, cards, dialogs, toasts, select, slider, accordion, tabs.
* **Animations (React Spring):**
  * Tab transitions (fade + slide).
  * Button press feedback (scale down on press).
  * Card appearance (stagger fade-in for lists).
  * Modal open/close (scale + fade).
  * **Subtle motion**: Avoid over-animation (keep it classy).
* **Feedback:**
  * **Toasts** for: saves, errors, recommendations loaded, list created.
  * **Skeleton loaders** for loading states (cards, map pins).
  * **Empty states**: Friendly illustrations + prompts when no data.
* **Color Palette** (suggestion):
  * Primary: Warm orange/coral (CTA buttons, active states)
  * Success: Green (likes, confirmations)
  * Warning: Yellow (maybe actions)
  * Danger: Red (pass, delete)
  * Neutral: Grays (text, borders, backgrounds)
  * Background: Off-white or light gray

---

## 🧩 Architecture Overview

### Frontend

* **Framework:** Next.js 14+ (App Router)
* **Styling:** TailwindCSS + ShadCN
* **Animations:** React Spring
* **State Management:** TanStack Query (React Query) for server state
* **Maps:** @vis.gl/react-google-maps
* **Forms:** React Hook Form + Zod validation
* **Icons:** Lucide React
* **Routing:**
  * `/` → Landing page (public) or redirect to `/app` if authenticated
  * `/auth/signin` → Sign-in page
  * `/auth/signup` → Sign-up page
  * `/auth/forgot-password` → Password reset
  * `/onboarding` → Onboarding flow (protected, only for new users)
  * `/app` → Authenticated layout with bottom nav
    * `/app/list` → List view (default)
    * `/app/map` → Map view
    * `/app/profile` → Profile view

### Backend

* **Supabase**
  * **Auth:** Email/password authentication
  * **Database:** Postgres for relational data
  * **RLS:** Row Level Security for multi-tenant safety
  * **Storage:** (Optional) For user-uploaded content later

* **Next.js Route Handlers (API Routes)**

  1. **`/api/places/search`** (POST)
     * **Input:** `{ city, cuisines[], priceLevel[], maxDistance, minRating, limit, offset }`
     * **Logic:**
       * Geocode city to lat/lng (cache result)
       * Call Google Places API (New) Text Search or Nearby Search
       * Fetch up to `limit` results (default 20)
       * For each result:
         * Cache in `restaurants` table (upsert by place_id)
         * Return normalized restaurant object
     * **Output:** `{ restaurants: [], totalCount, hasMore }`
     * **Error handling:** Return 500 with error message if Google API fails

  2. **`/api/places/details/:placeId`** (GET)
     * **Input:** Place ID (URL param)
     * **Logic:**
       * Check `restaurants` cache first (if cached < 7 days ago, return cached)
       * Otherwise, call Google Places API (New) Place Details
       * Update cache
     * **Output:** Full restaurant object with photos, hours, etc.

  3. **`/api/interactions`** (POST)
     * **Input:** `{ placeId, action: 'like' | 'pass' | 'maybe' | 'save', metadata?: {} }`
     * **Logic:**
       * Validate Supabase session
       * Insert into `user_interactions` table
       * If action === 'save', also insert into `list_restaurants` (default Favorites list)
     * **Output:** `{ success: true }`

  4. **`/api/places/recommendations`** (POST)
     * **Input:** `{ city }`
     * **Logic:**
       * Validate session
       * Check user has ≥5 interactions (return 400 if not)
       * Load user preferences from `user_preferences`
       * Load user interactions from `user_interactions`
       * **Aggregate interaction patterns:**
         * Count likes by cuisine, price_level
         * Identify favorite neighborhoods, rating thresholds
       * **Build Claude prompt:**
         * System: "You are a restaurant recommendation expert."
         * User: "Given this user's preferences and interaction history, suggest 10 restaurants in {city} that match their taste. Output JSON only."
         * Include user preferences + aggregated signals
         * Provide JSON schema for output
       * **Call Claude 3.5 Sonnet API**
       * **Parse Claude response** (JSON with restaurant names)
       * **For each recommended restaurant:**
         * Use Google Places Text Search to resolve `place_id`
         * Fetch details via Place Details API
         * Cache in `restaurants` table
       * **Fallback:** If Claude suggests a name we can't resolve, log warning and skip (don't fail entire request)
     * **Output:** `{ recommendations: [] }` (array of full restaurant objects)
     * **Error handling:**
       * If Claude API fails: Return 503 with message "Recommendation service temporarily unavailable"
       * If Google API fails: Return partial results or fallback to popular places

  5. **`/api/lists`** (GET, POST, PATCH, DELETE)
     * **GET:** Return all user lists with restaurant counts
     * **POST:** Create new list `{ name }`
     * **PATCH /:listId:** Rename list `{ name }`
     * **DELETE /:listId:** Delete list (cascade deletes `list_restaurants`)

  6. **`/api/lists/:listId/restaurants`** (POST, DELETE)
     * **POST:** Add restaurant to list `{ placeId }`
     * **DELETE /:placeId:** Remove restaurant from list

  7. **`/api/user/preferences`** (GET, PATCH)
     * **GET:** Return current user preferences
     * **PATCH:** Update preferences `{ defaultCity?, preferredCuisines?, priceRange?, maxDistance?, vibeTags? }`

---

## 🧠 Claude-Powered Recommendation Logic (Detailed)

### Inputs to Claude 3.5 Sonnet

**Context sent in prompt:**

```
User Profile:
- Default city: {city}
- Preferred cuisines: {cuisines[]}
- Price range: {priceRange[]}
- Max distance: {maxDistance} miles
- Vibe tags: {vibeTags[]}

Interaction History (Last 50):
- Liked restaurants:
  * {name} - {cuisine}, {price}, {rating}
  * ...
- Passed restaurants:
  * {name} - {cuisine}, {price}, {rating}
  * ...
- Saved restaurants:
  * {name} - {cuisine}, {price}, {rating}
  * ...

Aggregated Patterns:
- Most liked cuisines: {top 3}
- Average price preference: {avg}
- Average rating preference: {avg}
- Preferred neighborhoods: {top 3 if applicable}

Task:
Recommend 10 restaurants in {city} that best match this user's taste.
Focus on variety while staying within their preferences.
Output strictly valid JSON matching the schema below.
```

### Expected JSON Schema from Claude

```json
{
  "recommendations": [
    {
      "name": "Carbone",
      "cuisine": "Italian",
      "priceLevel": 4,
      "reasoning": "Upscale Italian matches user's preference for fine dining and Italian cuisine",
      "expectedRating": 4.6,
      "neighborhood": "Greenwich Village"
    },
    ...
  ]
}
```

### Post-processing Steps

1. Parse Claude response (validate JSON)
2. For each recommendation:
   * **Google Places Text Search:**
     * Query: `"{name}" restaurant in {city}, {neighborhood}"`
     * Take first result with matching name (fuzzy match OK)
   * **Fetch Place Details:**
     * Get full data: photos, rating, price_level, hours, address, etc.
   * **Cache in `restaurants` table** (upsert)
   * **If resolution fails:**
     * Log warning: `Could not resolve restaurant: {name}`
     * Skip and continue (don't block entire response)
3. Return array of resolved restaurant objects to frontend

### Fallback Strategy

* **If Claude API is down:**
  * Return popular/trending restaurants from cache (highest rated in city)
  * Show message: "Using popular picks (recommendations temporarily unavailable)"
* **If user has <5 interactions:**
  * Don't allow recommendations yet
  * Show tooltip: "Rate at least 5 restaurants to get personalized recommendations"
* **If no restaurants can be resolved:**
  * Return 404 with message: "No recommendations found. Try exploring more restaurants first."

---

## 🧱 Database Schema (Supabase Postgres)

### `users`

| Field      | Type          | Constraints          |
| ---------- | ------------- | -------------------- |
| id         | uuid          | PRIMARY KEY (Supabase auth.users FK) |
| email      | text          | UNIQUE, NOT NULL     |
| created_at | timestamptz   | DEFAULT NOW()        |
| updated_at | timestamptz   | DEFAULT NOW()        |

**RLS:** Users can only read their own row.

---

### `user_preferences`

| Field               | Type      | Constraints                  |
| ------------------- | --------- | ---------------------------- |
| id                  | uuid      | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| user_id             | uuid      | UNIQUE, FK → users.id ON DELETE CASCADE |
| default_city        | text      | NOT NULL                     |
| preferred_cuisines  | text[]    | DEFAULT '{}'                 |
| price_range         | int[]     | DEFAULT '{1,2,3,4}' (1-4)    |
| max_distance        | float     | DEFAULT 10.0 (miles)         |
| vibe_tags           | text[]    | DEFAULT '{}'                 |
| created_at          | timestamptz | DEFAULT NOW()              |
| updated_at          | timestamptz | DEFAULT NOW()              |

**RLS:** Users can only read/update their own preferences.

**Indexes:**
* `user_id` (unique)

---

### `user_interactions`

| Field      | Type                                     | Constraints |
| ---------- | ---------------------------------------- | ----------- |
| id         | uuid                                     | PRIMARY KEY |
| user_id    | uuid                                     | FK → users.id ON DELETE CASCADE |
| place_id   | text                                     | NOT NULL    |
| action     | text                                     | NOT NULL, CHECK (action IN ('like', 'pass', 'maybe', 'save', 'open')) |
| metadata   | jsonb                                    | DEFAULT '{}' |
| created_at | timestamptz                              | DEFAULT NOW() |

**RLS:** Users can only insert/read their own interactions.

**Indexes:**
* `(user_id, created_at DESC)` for recent interactions query
* `(user_id, action)` for filtering by action type
* `(user_id, place_id)` for deduplication checks

**Metadata fields** (examples):
```json
{
  "source": "list_view" | "map_view" | "profile",
  "context": "search" | "recommendation",
  "position": 3
}
```

---

### `restaurants` (Cache Table)

| Field      | Type        | Constraints      |
| ---------- | ----------- | ---------------- |
| place_id   | text        | PRIMARY KEY      |
| data       | jsonb       | NOT NULL         |
| cached_at  | timestamptz | DEFAULT NOW()    |

**RLS:** Public read access (no writes from client).

**`data` structure** (from Google Places API):
```json
{
  "name": "Carbone",
  "formatted_address": "181 Thompson St, New York, NY 10012",
  "formatted_phone_number": "(212) 254-3000",
  "website": "https://carbonenewyork.com",
  "rating": 4.6,
  "user_ratings_total": 1523,
  "price_level": 4,
  "types": ["restaurant", "food", "point_of_interest"],
  "geometry": {
    "location": { "lat": 40.7281, "lng": -74.0021 }
  },
  "photos": [
    { "photo_reference": "...", "width": 4032, "height": 3024 }
  ],
  "opening_hours": {
    "open_now": true,
    "weekday_text": [...]
  },
  "business_status": "OPERATIONAL"
}
```

**Cache Invalidation:**
* Refresh if `cached_at < NOW() - INTERVAL '7 days'`

---

### `lists`

| Field      | Type        | Constraints                  |
| ---------- | ----------- | ---------------------------- |
| id         | uuid        | PRIMARY KEY                  |
| user_id    | uuid        | FK → users.id ON DELETE CASCADE |
| name       | text        | NOT NULL                     |
| is_default | boolean     | DEFAULT FALSE                |
| created_at | timestamptz | DEFAULT NOW()                |
| updated_at | timestamptz | DEFAULT NOW()                |

**RLS:** Users can only manage their own lists.

**Indexes:**
* `(user_id, name)` unique constraint (user can't have duplicate list names)

**Default List:**
* Created automatically on user signup
* `name = 'Favorites'`, `is_default = TRUE`
* Cannot be deleted (enforce in app logic)

---

### `list_restaurants`

| Field      | Type        | Constraints                  |
| ---------- | ----------- | ---------------------------- |
| id         | uuid        | PRIMARY KEY                  |
| list_id    | uuid        | FK → lists.id ON DELETE CASCADE |
| place_id   | text        | NOT NULL                     |
| added_at   | timestamptz | DEFAULT NOW()                |

**RLS:** Users can only manage restaurants in their own lists (via `list_id → lists.user_id`).

**Indexes:**
* `(list_id, place_id)` unique constraint (no duplicate restaurants in same list)
* `list_id` for fast list queries

**Note:** Restaurants can exist in multiple lists (many-to-many via this junction table).

---

### Database Functions & Triggers

**Auto-create default Favorites list on user signup:**

```sql
CREATE OR REPLACE FUNCTION create_default_list()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lists (user_id, name, is_default)
  VALUES (NEW.id, 'Favorites', TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_list();
```

**Update `updated_at` timestamp on row update:**

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## ⚙️ Implementation Phases (for Claude Code to Follow)

### Phase 1: Project Setup & Configuration
* Initialize Next.js 14 with App Router
* Configure TypeScript with strict mode
* Set up TailwindCSS + ShadCN UI
* Install dependencies:
  * `@supabase/ssr` for auth
  * `@tanstack/react-query` for data fetching
  * `@vis.gl/react-google-maps` for maps
  * `react-spring` for animations
  * `react-hook-form` + `zod` for forms
  * `lucide-react` for icons
* Create `.env.local` template with required keys
* Set up basic file structure:
  ```
  /app
    /auth
    /onboarding
    /app
      /list
      /map
      /profile
  /components
  /lib
  /types
  ```

### Phase 2: Supabase Setup & Database Schema
* Create Supabase project
* Run SQL migrations to create tables:
  * `users`, `user_preferences`, `user_interactions`, `restaurants`, `lists`, `list_restaurants`
* Set up RLS policies for each table
* Create database functions and triggers
* Configure Supabase Auth (email/password provider)
* Test database connection from Next.js

### Phase 3: Authentication Flow
* Create Supabase client utilities (server/client)
* Build auth pages:
  * `/auth/signin` - Sign-in form
  * `/auth/signup` - Sign-up form
  * `/auth/forgot-password` - Password reset
* Implement auth middleware for protected routes
* Create auth context/hooks for client-side session management
* Test sign-up → onboarding → main app flow

### Phase 4: Onboarding Flow
* Build multi-step onboarding UI:
  * Step 1: City input with Google Places Autocomplete
  * Step 2: Cuisine preferences, price range, distance
  * Step 3: Vibe tags
* Form validation with React Hook Form + Zod
* Save preferences to `user_preferences` table
* Redirect to `/app/list` on completion
* Allow skip option with fallback handling

### Phase 5: App Shell & Bottom Navigation
* Create `/app` layout with bottom navigation
* Implement tab routing (List, Map, Profile)
* Add React Spring animations for tab transitions
* Build responsive navigation (bottom on mobile, side on desktop)
* Create shared header component with app title

### Phase 6: Google Places Search API Integration
* Set up Google Cloud project & enable Places API (New)
* Implement `/api/places/search` route handler:
  * Accept filter parameters
  * Geocode city to lat/lng
  * Call Google Places Text Search API
  * Normalize and cache results in `restaurants` table
  * Return paginated results (20 per page)
* Implement `/api/places/details/:placeId` route handler
* Add error handling and rate limiting

### Phase 7: List View UI & Interactions
* Build List View page (`/app/list`):
  * Preferences filter form
  * Restaurant card grid with pagination
  * "Load More" button
* Implement restaurant card component:
  * Photo, name, rating, cuisine, price, distance
  * Action buttons: Like, Pass, Maybe, Save
* Add React Spring animations:
  * Card stagger fade-in
  * Button press feedback
  * Skeleton loaders
* Implement `/api/interactions` POST endpoint
* Connect actions to API (log interactions)
* Add toast notifications for user feedback

### Phase 8: Claude Recommendations API
* Set up Anthropic Claude API key
* Implement `/api/places/recommendations` route handler:
  * Validate user has ≥5 interactions
  * Aggregate user preferences and interaction patterns
  * Build Claude prompt with user context
  * Call Claude 3.5 Sonnet API
  * Parse JSON response
  * Resolve restaurant names via Google Places
  * Return enriched recommendations
* Add fallback handling for API failures
* Update List View to show recommendations
* Add "Get Smart Recommendations" button with loading state

### Phase 9: Map View Implementation
* Install and configure `@vis.gl/react-google-maps`
* Build Map View page (`/app/map`):
  * Google Map centered on user's city
  * Custom pins for restaurants (color-coded by interaction)
  * Info window on pin click
* Sync map state with List View results
* Add map controls (zoom, center, satellite/terrain toggle)
* Implement "Open in Google Maps" deep link

### Phase 10: Profile View & Lists Management
* Build Profile View page (`/app/profile`) with sections:
  * Favorites (default list)
  * My Lists (custom lists)
  * Preferences editor
  * Account settings
* Implement `/api/lists` CRUD endpoints
* Implement `/api/lists/:listId/restaurants` endpoints
* Build UI for:
  * Creating/renaming/deleting lists
  * Adding/removing restaurants from lists
  * Restaurant detail modal
* Add preference editing with form validation
* Implement account actions (change password, logout, delete account)

### Phase 11: Polish & Animations
* Refine React Spring animations across all views
* Add loading states and skeleton loaders everywhere
* Implement empty states with friendly illustrations
* Ensure mobile-first responsive design
* Add error boundaries for graceful error handling
* Optimize images (Next.js Image component)
* Add meta tags for SEO

### Phase 12: Testing & Bug Fixes
* Test all user flows end-to-end
* Test authentication edge cases
* Test API error scenarios
* Test with limited/no data (new users)
* Test on multiple devices and browsers
* Fix any bugs discovered
* Validate RLS policies work correctly

### Phase 13: Deployment & Production Setup
* Configure environment variables in Vercel:
  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  * `SUPABASE_SERVICE_ROLE_KEY`
  * `GOOGLE_MAPS_API_KEY`
  * `ANTHROPIC_API_KEY`
* Set up Supabase production project
* Run database migrations in production
* Deploy to Vercel
* Test production deployment
* Set up error monitoring (Sentry or similar)
* Configure domain (if applicable)

---

## 🔐 Security Requirements

### Authentication & Authorization
* All protected routes require valid Supabase session
* Use Supabase Auth middleware in Next.js
* RLS policies enforce user-specific data access
* Never expose service role key to client

### API Security
* All API routes validate Supabase session server-side
* Rate limiting on expensive endpoints (recommendations, search)
* Input validation with Zod schemas
* Sanitize user inputs before database queries

### API Keys
* **All API keys stored in environment variables**:
  * Google Maps/Places API key (restrict by domain in Google Cloud Console)
  * Claude API key (Anthropic dashboard)
  * Supabase keys (public anon key for client, service role for server only)
* Never expose API keys in client-side code
* All external API calls made server-side in route handlers

### Data Privacy
* User interactions are private (RLS enforced)
* Anonymize data before sending to Claude (no PII)
* GDPR-compliant account deletion (cascade deletes)
* No third-party analytics in MVP (add later with consent)

### HTTPS & CORS
* Vercel enforces HTTPS automatically
* Configure CORS headers if adding external clients later

---

## ✅ Success Criteria

### Functional Requirements
✅ User can sign up, log in, and complete onboarding
✅ User can search for restaurants with filters
✅ User can interact with restaurants (like, pass, maybe, save)
✅ User can view restaurants on a map
✅ User can get personalized recommendations from Claude
✅ User can manage saved restaurants and custom lists
✅ User can edit preferences

### Technical Requirements
✅ All data persists correctly in Supabase
✅ RLS policies prevent unauthorized access
✅ Google Places API integration works reliably
✅ Claude API returns relevant recommendations
✅ Recommendations resolve correctly via Google Places
✅ No exposed API keys or secrets

### UX Requirements
✅ Mobile-first responsive design
✅ Smooth animations and transitions
✅ Clear loading states and error handling
✅ Fast page loads (<3s initial load)
✅ Intuitive navigation and clear CTAs

### Production Requirements
✅ Successfully deployed on Vercel
✅ Environment variables configured correctly
✅ No console errors or warnings
✅ Works across modern browsers (Chrome, Safari, Firefox, Edge)
✅ Works on mobile devices (iOS Safari, Chrome Android)

---

## 📊 API Rate Limits & Quotas

### Google Places API
* **Text Search:** $32 per 1000 requests
* **Place Details:** $17 per 1000 requests
* **Photos:** $7 per 1000 requests
* **Autocomplete:** $2.83 per 1000 requests

**MVP Strategy:**
* Cache aggressively (7-day TTL for restaurant data)
* Limit search results to 20 per query
* Implement request deduplication
* Monitor usage in Google Cloud Console

### Claude API (Anthropic)
* **Claude 3.5 Sonnet:** $3 per million input tokens, $15 per million output tokens
* Recommendations should cost ~$0.01-0.05 per request

**MVP Strategy:**
* Require ≥5 interactions before recommendations
* Limit recommendation calls to 1 per user per 5 minutes (rate limit)
* Keep prompts concise (optimize token usage)
* Monitor usage in Anthropic Console

---

## 🚀 Future Enhancements (Post-MVP)

* Social login (Google, Apple OAuth)
* Real-time collaborative lists (share with friends)
* Push notifications for new recommendations
* Advanced filters (dietary restrictions, ambiance, parking)
* User reviews and photos
* Reservation integration (OpenTable, Resy)
* Explore feed (trending, popular, nearby)
* Dark mode
* Multi-language support
* Progressive Web App (PWA) with offline support
* Pin clustering on map for high-density areas
* Dynamic map fetching (search as you pan/zoom)

---

## 📝 Notes for Implementation

* Use TypeScript strict mode throughout
* Follow Next.js App Router best practices
* Use server components where possible, client components only when needed
* Implement proper error boundaries
* Use React Hook Form for all forms (better performance than uncontrolled)
* Use TanStack Query for all data fetching (automatic caching, refetching)
* Keep components small and focused (single responsibility)
* Use ShadCN components consistently (don't mix with other UI libraries)
* Follow accessibility best practices (ARIA labels, keyboard navigation)
* Write clear comments for complex logic
* Use meaningful variable names
* Keep API routes thin (delegate to service layer if logic grows)

---

**End of PRD**

This document should serve as the single source of truth for the TasteSwipe MVP. All implementation decisions should align with the specifications above. If clarifications are needed during development, update this PRD accordingly.
