import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchRestaurants } from '@/lib/google-places';
import { RESTAURANT_CACHE_TTL_DAYS, RESULTS_PER_PAGE } from '@/lib/constants';
import { createHash } from 'crypto';

/**
 * Generate a cache key from search parameters
 */
function generateSearchCacheKey(params: {
  city: string;
  cuisines: string[];
  priceLevel: number[];
  minRating: number;
}): string {
  const key = JSON.stringify({
    city: params.city.toLowerCase().trim(),
    cuisines: params.cuisines.sort(),
    priceLevel: params.priceLevel.sort(),
    minRating: params.minRating,
  });
  return createHash('sha256').update(key).digest('hex');
}

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

    // Generate cache key for this search
    const cacheKey = generateSearchCacheKey({ city, cuisines, priceLevel, minRating });
    
    // Check if we have cached search results (1 hour TTL for search results)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: cachedSearch } = await supabase
      .from('search_cache')
      .select('results, cached_at')
      .eq('cache_key', cacheKey)
      .gt('cached_at', oneHourAgo)
      .single();

    let restaurants;
    
    if (cachedSearch && cachedSearch.results) {
      // Return cached results
      restaurants = cachedSearch.results as any[];
      console.log(`Cache hit for search: ${city} (${cuisines.join(', ')})`);
    } else {
      // Cache miss - call Google Places API
      console.log(`Cache miss for search: ${city} (${cuisines.join(', ')})`);
      restaurants = await searchRestaurants({
        city,
        cuisines,
        priceLevel,
        maxDistance,
        minRating,
        limit: limit + offset, // Get more to account for offset
      });

      // Cache the search results
      await supabase.from('search_cache').upsert({
        cache_key: cacheKey,
        results: restaurants,
        cached_at: new Date().toISOString(),
      });
    }

    // Cache each restaurant in Supabase using real Google place_id
    for (const restaurant of restaurants) {
      if (!restaurant.place_id) {
        console.warn(`Restaurant ${restaurant.name} missing place_id, skipping cache`);
        continue;
      }

      await supabase.from('restaurants').upsert({
        place_id: restaurant.place_id, // Use real Google place_id
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
