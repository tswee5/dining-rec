import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClaudeRecommendations } from '@/lib/anthropic';
import { searchRestaurants } from '@/lib/google-places';
import type { RestaurantData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { city, limit = 10, chat, filters, force = false } = body;

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    // 1. Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!preferences) {
      return NextResponse.json(
        { error: 'User preferences not found' },
        { status: 404 }
      );
    }

    // 2. Get preference summary
    const { data: summaryData } = await supabase
      .from('preference_summaries')
      .select('summary')
      .eq('user_id', user.id)
      .single();

    const preferenceSummary = summaryData?.summary;

    // 3. Get user interaction history
    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('place_id, action, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    // Check if user has enough interactions
    const totalInteractions = interactions?.length || 0;
    if (totalInteractions < 5) {
      return NextResponse.json(
        {
          error: 'Not enough interaction history',
          message: `You need at least 5 interactions to get personalized recommendations. You have ${totalInteractions}.`,
        },
        { status: 400 }
      );
    }

    // 4. Aggregate interactions by action and fetch restaurant data
    const likes: RestaurantData[] = [];
    const passes: RestaurantData[] = [];
    const maybes: RestaurantData[] = [];

    if (interactions) {
      for (const interaction of interactions) {
        // Fetch restaurant data from cache
        const { data: cachedRestaurant } = await supabase
          .from('restaurants')
          .select('data')
          .eq('place_id', interaction.place_id)
          .single();

        if (cachedRestaurant) {
          const restaurant = cachedRestaurant.data as RestaurantData;

          if (interaction.action === 'like' || interaction.action === 'save') {
            likes.push(restaurant);
          } else if (interaction.action === 'pass') {
            passes.push(restaurant);
          } else if (interaction.action === 'maybe') {
            maybes.push(restaurant);
          }
        }
      }
    }

    // 5. Build interaction history for Claude
    const interactionHistory = {
      likes: likes.map((r) => ({
        name: r.name,
        types: r.types,
        price_level: r.price_level,
        rating: r.rating,
      })),
      passes: passes.map((r) => ({
        name: r.name,
        types: r.types,
      })),
      maybes: maybes.map((r) => ({
        name: r.name,
        types: r.types,
      })),
    };

    // 6. Get Claude recommendations
    const claudeResponse = await getClaudeRecommendations({
      userPreferences: {
        preferredCuisines: preferences.preferred_cuisines || [],
        priceRange: preferences.price_range || [1, 2, 3, 4],
        maxDistance: preferences.max_distance || 10,
        vibeTags: preferences.vibe_tags || [],
        defaultCity: preferences.default_city,
        ageRange: preferences.age_range,
        neighborhood: preferences.neighborhood,
        diningFrequency: preferences.dining_frequency,
        typicalSpend: preferences.typical_spend,
      },
      interactionHistory,
      preferenceSummary,
      chatIntent: chat,
      filters,
      city,
      limit,
    });

    // 7. Resolve restaurant names to actual places via Google Places (batched with cache checks)
    const resolvedRestaurants: Array<{
      restaurant: RestaurantData;
      reason: string;
      confidence: string;
    }> = [];

    // Helper function to check cache for a restaurant by name
    async function checkRestaurantCache(restaurantName: string): Promise<RestaurantData | null> {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from('restaurants')
        .select('data, cached_at')
        .gt('cached_at', sevenDaysAgo)
        .limit(100); // Get recent restaurants

      if (cached) {
        // Find restaurant by name (fuzzy match)
        const match = cached.find((r: any) => {
          const cachedName = (r.data as RestaurantData).name.toLowerCase();
          const searchName = restaurantName.toLowerCase();
          return cachedName.includes(searchName) || searchName.includes(cachedName);
        });
        if (match) {
          return match.data as RestaurantData;
        }
      }
      return null;
    }

    // Batch resolution with concurrency limit (max 3 concurrent requests)
    const CONCURRENCY_LIMIT = 3;
    const resolutionPromises = claudeResponse.recommendations.map(async (recommendation, index) => {
      // Stagger requests to respect concurrency limit
      await new Promise(resolve => setTimeout(resolve, (index % CONCURRENCY_LIMIT) * 100));

      try {
        // Check cache first
        const cached = await checkRestaurantCache(recommendation.restaurantName);
        if (cached) {
          console.log(`Cache hit for restaurant: ${recommendation.restaurantName}`);
          return {
            restaurant: cached,
            reason: recommendation.reason,
            confidence: recommendation.confidence,
          };
        }

        // Cache miss - call API
        console.log(`Cache miss for restaurant: ${recommendation.restaurantName}`);
        const searchResults = await searchRestaurants({
          city,
          query: recommendation.restaurantName,
          limit: 1,
        });

        if (searchResults.length > 0) {
          const restaurant = searchResults[0];

          // Cache the restaurant using real Google place_id
          if (restaurant.place_id) {
            await supabase.from('restaurants').upsert({
              place_id: restaurant.place_id,
              data: restaurant,
              cached_at: new Date().toISOString(),
            });
          } else {
            console.warn(`Restaurant ${restaurant.name} missing place_id, skipping cache`);
          }

          return {
            restaurant,
            reason: recommendation.reason,
            confidence: recommendation.confidence,
          };
        } else {
          console.warn(`Could not resolve restaurant: ${recommendation.restaurantName}`);
          return null;
        }
      } catch (error) {
        console.error(
          `Error resolving restaurant ${recommendation.restaurantName}:`,
          error
        );
        return null;
      }
    });

    // Wait for all resolutions (with concurrency naturally limited by staggered delays)
    const results = await Promise.all(resolutionPromises);
    results.forEach(result => {
      if (result) {
        resolvedRestaurants.push(result);
      }
    });

    return NextResponse.json({
      recommendations: resolvedRestaurants,
      totalCount: resolvedRestaurants.length,
      interactionCount: totalInteractions,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
