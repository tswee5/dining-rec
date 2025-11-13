import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { placeId, action, metadata = {} } = body;

    if (!placeId || !action) {
      return NextResponse.json(
        { error: 'Place ID and action are required' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['like', 'pass', 'maybe', 'save', 'open'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Insert interaction
    const { error: interactionError } = await supabase.from('user_interactions').insert({
      user_id: user.id,
      place_id: placeId,
      action,
      metadata,
    });

    if (interactionError) {
      console.error('Interaction error:', interactionError);
      return NextResponse.json(
        { error: 'Failed to save interaction' },
        { status: 500 }
      );
    }

    // If action is 'save', also add to default Favorites list
    if (action === 'save') {
      // Get user's default list
      const { data: defaultList } = await supabase
        .from('lists')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (defaultList) {
        // Add to list (ignore if already exists)
        await supabase.from('list_restaurants').insert({
          list_id: defaultList.id,
          place_id: placeId,
        }).select();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Interaction error:', error);
    return NextResponse.json(
      { error: 'Failed to process interaction' },
      { status: 500 }
    );
  }
}
