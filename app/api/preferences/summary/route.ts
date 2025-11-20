import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing summary
    const { data: summary, error: summaryError } = await supabase
      .from('preference_summaries')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is fine
      console.error('Summary fetch error:', summaryError);
      return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
    }

    return NextResponse.json({
      summary: summary || null,
    });
  } catch (error) {
    console.error('Preferences summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch last 100 interactions
    const { data: interactions, error: interactionsError } = await supabase
      .from('user_interactions')
      .select('place_id, action, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (interactionsError) {
      console.error('Interactions fetch error:', interactionsError);
      return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
    }

    if (!interactions || interactions.length === 0) {
      return NextResponse.json({
        summary: 'No interaction history yet.',
      });
    }

    // Aggregate interactions
    const likes = interactions.filter((i) => i.action === 'like');
    const passes = interactions.filter((i) => i.action === 'pass');
    const saves = interactions.filter((i) => i.action === 'save');

    // Extract patterns from metadata
    const cuisines: { [key: string]: number } = {};
    const priceRanges: { [key: string]: number } = {};
    const neighborhoods: { [key: string]: number } = {};
    const dislikedCuisines: { [key: string]: number } = {};

    // Fetch restaurant data for liked/saved items
    const likedPlaceIds = [...likes, ...saves].map((i) => i.place_id);
    const passedPlaceIds = passes.map((i) => i.place_id);

    if (likedPlaceIds.length > 0) {
      const { data: likedRestaurants } = await supabase
        .from('restaurants')
        .select('place_id, data')
        .in('place_id', likedPlaceIds);

      likedRestaurants?.forEach((restaurant) => {
        const data = restaurant.data as any;

        // Count cuisines from types
        if (data.types && Array.isArray(data.types)) {
          data.types.forEach((type: string) => {
            if (!['point_of_interest', 'establishment', 'food'].includes(type)) {
              cuisines[type] = (cuisines[type] || 0) + 1;
            }
          });
        }

        // Count price levels
        if (data.price_level) {
          const priceKey = '$'.repeat(data.price_level);
          priceRanges[priceKey] = (priceRanges[priceKey] || 0) + 1;
        }

        // Extract neighborhood from address
        if (data.formatted_address) {
          const addressParts = data.formatted_address.split(',');
          if (addressParts.length > 1) {
            const neighborhood = addressParts[1].trim();
            neighborhoods[neighborhood] = (neighborhoods[neighborhood] || 0) + 1;
          }
        }
      });
    }

    if (passedPlaceIds.length > 0) {
      const { data: passedRestaurants } = await supabase
        .from('restaurants')
        .select('place_id, data')
        .in('place_id', passedPlaceIds);

      passedRestaurants?.forEach((restaurant) => {
        const data = restaurant.data as any;
        if (data.types && Array.isArray(data.types)) {
          data.types.forEach((type: string) => {
            if (!['point_of_interest', 'establishment', 'food'].includes(type)) {
              dislikedCuisines[type] = (dislikedCuisines[type] || 0) + 1;
            }
          });
        }
      });
    }

    // Build summary string
    const topCuisines = Object.entries(cuisines)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cuisine, count]) => `${cuisine.replace(/_/g, ' ')} (${count})`)
      .join(', ');

    const topPrices = Object.entries(priceRanges)
      .sort(([, a], [, b]) => b - a)
      .map(([price]) => price)
      .join(', ');

    const topNeighborhoods = Object.entries(neighborhoods)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([neighborhood]) => neighborhood)
      .join(', ');

    const topDislikes = Object.entries(dislikedCuisines)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cuisine]) => cuisine.replace(/_/g, ' '))
      .join(', ');

    const summaryParts = [];

    if (topCuisines) {
      summaryParts.push(`Favored cuisines: ${topCuisines}`);
    }

    if (topPrices) {
      summaryParts.push(`Price preference: ${topPrices}`);
    }

    if (topNeighborhoods) {
      summaryParts.push(`Frequent neighborhoods: ${topNeighborhoods}`);
    }

    if (topDislikes) {
      summaryParts.push(`Tends to avoid: ${topDislikes}`);
    }

    summaryParts.push(`Total interactions: ${interactions.length} (${likes.length} likes, ${passes.length} passes, ${saves.length} saves)`);

    const summaryText = summaryParts.join('. ') + '.';

    // Upsert summary
    const { error: upsertError } = await supabase
      .from('preference_summaries')
      .upsert({
        user_id: user.id,
        summary: summaryText,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error('Summary upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to save summary' }, { status: 500 });
    }

    return NextResponse.json({
      summary: summaryText,
      stats: {
        totalInteractions: interactions.length,
        likes: likes.length,
        passes: passes.length,
        saves: saves.length,
      },
    });
  } catch (error) {
    console.error('Preferences summary refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
