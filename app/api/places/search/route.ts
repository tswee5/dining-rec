import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchRestaurants } from '@/lib/google-places';
import { RESTAURANT_CACHE_TTL_DAYS, RESULTS_PER_PAGE } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      city,
      cuisines = [],
      priceLevel = [1, 2, 3, 4],
      maxDistance = 10,
      minRating = 0,
      limit = RESULTS_PER_PAGE,
      offset = 0,
    } = body;

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    // Search for restaurants using Google Places API
    const restaurants = await searchRestaurants({
      city,
      cuisines,
      priceLevel,
      maxDistance,
      minRating,
      limit: limit + offset, // Get more to account for offset
    });

    // Cache each restaurant in Supabase
    for (const restaurant of restaurants) {
      // Generate a simple place_id from the name and address for caching
      // In a real app, you'd use the actual Google Place ID
      const cacheKey = `${restaurant.name}-${restaurant.formatted_address}`.toLowerCase().replace(/\s+/g, '-');

      await supabase.from('restaurants').upsert({
        place_id: cacheKey,
        data: restaurant,
        cached_at: new Date().toISOString(),
      });
    }

    // Apply pagination
    const paginatedRestaurants = restaurants.slice(offset, offset + limit);

    return NextResponse.json({
      restaurants: paginatedRestaurants,
      totalCount: restaurants.length,
      hasMore: restaurants.length > offset + limit,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search restaurants' },
      { status: 500 }
    );
  }
}
