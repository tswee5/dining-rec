import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all lists for the current user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: lists, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lists fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
    }

    return NextResponse.json({ lists });
  } catch (error) {
    console.error('Lists error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// POST create a new list
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: newList, error } = await supabase
      .from('lists')
      .insert({
        user_id: user.id,
        name,
        description,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      console.error('List creation error:', error);
      return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
    }

    return NextResponse.json({ list: newList });
  } catch (error) {
    console.error('List creation error:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
