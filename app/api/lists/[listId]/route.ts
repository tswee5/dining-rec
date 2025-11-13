import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET a specific list and its restaurants
export async function GET(
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

    // Get list
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('*')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single();

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Get restaurants in the list
    const { data: listRestaurants, error: restaurantsError } = await supabase
      .from('list_restaurants')
      .select('*, restaurants(data)')
      .eq('list_id', listId);

    if (restaurantsError) {
      console.error('Restaurants fetch error:', restaurantsError);
      return NextResponse.json(
        { error: 'Failed to fetch restaurants' },
        { status: 500 }
      );
    }

    const restaurants = listRestaurants
      .map((lr: any) => lr.restaurants?.data)
      .filter((r: any) => r);

    return NextResponse.json({ list, restaurants });
  } catch (error) {
    console.error('List fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 });
  }
}

// PATCH update a list
export async function PATCH(
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
    const { name, description } = body;

    // Check if list belongs to user
    const { data: list } = await supabase
      .from('lists')
      .select('*')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single();

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Update list
    const { data: updatedList, error } = await supabase
      .from('lists')
      .update({ name, description })
      .eq('id', listId)
      .select()
      .single();

    if (error) {
      console.error('List update error:', error);
      return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
    }

    return NextResponse.json({ list: updatedList });
  } catch (error) {
    console.error('List update error:', error);
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}

// DELETE a list
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

    // Check if list belongs to user and is not default
    const { data: list } = await supabase
      .from('lists')
      .select('*')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single();

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    if (list.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default list' },
        { status: 400 }
      );
    }

    // Delete list (cascade will delete list_restaurants entries)
    const { error } = await supabase.from('lists').delete().eq('id', listId);

    if (error) {
      console.error('List deletion error:', error);
      return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('List deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
}
