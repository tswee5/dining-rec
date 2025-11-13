import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlaceDetails } from '@/lib/google-places';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    // Validate authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { placeId } = await params;

    if (!placeId) {
      return NextResponse.json({ error: 'Place ID is required' }, { status: 400 });
    }

    // Check cache first
    const { data: cachedRestaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('place_id', placeId)
      .single();

    // If cached and fresh (less than 7 days old), return it
    if (cachedRestaurant) {
      const cacheAge = Date.now() - new Date(cachedRestaurant.cached_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (cacheAge < sevenDays) {
        return NextResponse.json({ restaurant: cachedRestaurant.data });
      }
    }

    // Fetch fresh data from Google Places API
    const restaurant = await getPlaceDetails(placeId);

    // Update cache
    await supabase.from('restaurants').upsert({
      place_id: placeId,
      data: restaurant,
      cached_at: new Date().toISOString(),
    });

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error('Place details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    );
  }
}
