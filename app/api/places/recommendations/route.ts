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
    const { city, limit = 10 } = body;

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

    // 2. Get user interaction history
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

    // 3. Aggregate interactions by action and fetch restaurant data
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

    // 4. Build interaction history for Claude
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

    // 5. Get Claude recommendations
    const claudeResponse = await getClaudeRecommendations({
      userPreferences: {
        preferredCuisines: preferences.preferred_cuisines || [],
        priceRange: preferences.price_range || [1, 2, 3, 4],
        maxDistance: preferences.max_distance || 10,
        vibeTags: preferences.vibe_tags || [],
        defaultCity: preferences.default_city,
      },
      interactionHistory,
      city,
      limit,
    });

    // 6. Resolve restaurant names to actual places via Google Places
    const resolvedRestaurants: Array<{
      restaurant: RestaurantData;
      reason: string;
      confidence: string;
    }> = [];

    for (const recommendation of claudeResponse.recommendations) {
      try {
        // Search for the restaurant by name in the specified city
        const searchResults = await searchRestaurants({
          city,
          query: recommendation.restaurantName,
          limit: 1,
        });

        if (searchResults.length > 0) {
          const restaurant = searchResults[0];

          // Cache the restaurant
          const placeId = `${restaurant.name}-${restaurant.formatted_address}`
            .toLowerCase()
            .replace(/\s+/g, '-');

          await supabase.from('restaurants').upsert({
            place_id: placeId,
            data: restaurant,
            cached_at: new Date().toISOString(),
          });

          resolvedRestaurants.push({
            restaurant,
            reason: recommendation.reason,
            confidence: recommendation.confidence,
          });
        } else {
          console.warn(
            `Could not resolve restaurant: ${recommendation.restaurantName}`
          );
        }
      } catch (error) {
        console.error(
          `Error resolving restaurant ${recommendation.restaurantName}:`,
          error
        );
      }
    }

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
