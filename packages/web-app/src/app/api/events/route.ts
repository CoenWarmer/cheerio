import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { generateSlug } from '@/utils/slug';

// GET /api/events - Get all events
export async function GET() {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const {
      name,
      description,
      donation_link,
      start_time,
      status,
      is_private,
      created_by,
      location,
    } = body;

    // Validate required fields
    if (!name || !created_by) {
      return NextResponse.json(
        { error: 'Name and created_by are required' },
        { status: 400 }
      );
    }

    // Generate base slug from name
    let slug = generateSlug(name);

    // Check if slug already exists and make it unique if needed
    const { data: existingEvent } = await supabase
      .from('events')
      .select('slug')
      .eq('slug', slug)
      .single();

    // If slug exists, append a number
    if (existingEvent) {
      let counter = 1;
      let uniqueSlug = `${slug}-${counter}`;

      while (true) {
        const { data: checkEvent } = await supabase
          .from('events')
          .select('slug')
          .eq('slug', uniqueSlug)
          .single();

        if (!checkEvent) {
          slug = uniqueSlug;
          break;
        }

        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        name,
        slug,
        description: description || null,
        donation_link: donation_link || null,
        start_time: start_time || null,
        status: status || 'awaiting',
        is_private: is_private || false,
        created_by,
        location: location || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
