import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST add a restaurant to a list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId } = await params;
    const body = await request.json();
    const { placeId } = body;

    if (!placeId) {
      return NextResponse.json({ error: 'Place ID is required' }, { status: 400 });
    }

    // Verify list belongs to user
    const { data: list } = await supabase
      .from('lists')
      .select('*')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single();

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Add restaurant to list (ignore if already exists)
    const { data, error } = await supabase
      .from('list_restaurants')
      .insert({
        list_id: listId,
        place_id: placeId,
      })
      .select()
      .single();

    if (error) {
      // If it's a duplicate key error, that's okay
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Restaurant already in list' });
      }
      console.error('Add restaurant error:', error);
      return NextResponse.json(
        { error: 'Failed to add restaurant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Add restaurant error:', error);
    return NextResponse.json(
      { error: 'Failed to add restaurant' },
      { status: 500 }
    );
  }
}

// DELETE remove a restaurant from a list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId } = await params;
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json({ error: 'Place ID is required' }, { status: 400 });
    }

    // Verify list belongs to user
    const { data: list } = await supabase
      .from('lists')
      .select('*')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single();

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Remove restaurant from list
    const { error } = await supabase
      .from('list_restaurants')
      .delete()
      .eq('list_id', listId)
      .eq('place_id', placeId);

    if (error) {
      console.error('Remove restaurant error:', error);
      return NextResponse.json(
        { error: 'Failed to remove restaurant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove restaurant error:', error);
    return NextResponse.json(
      { error: 'Failed to remove restaurant' },
      { status: 500 }
    );
  }
}
