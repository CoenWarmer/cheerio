import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * GET /api/events/[slug]/activity/my-journey
 * Get current user's full journey in a event (all activities)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { slug } = await params;

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get event by slug
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch all activities for current user in this event
    const { data: activities, error } = await supabase
      .from('user_activity')
      .select('*')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching journey:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate summary statistics
    const locations = activities.filter(a => a.activity_type === 'location');
    const distances = activities.filter(a => a.activity_type === 'distance');
    const speeds = activities.filter(a => a.activity_type === 'speed');
    const music = activities.filter(a => a.activity_type === 'music');

    const summary = {
      total_activities: activities.length,
      location_points: locations.length,
      total_distance:
        distances.length > 0
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (distances[distances.length - 1].data as any).distance
          : 0,
      max_speed:
        speeds.length > 0
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Math.max(...speeds.map(s => (s.data as any).speed))
          : 0,
      songs_played: music.length,
      start_time: activities.length > 0 ? activities[0].created_at : null,
      last_update:
        activities.length > 0
          ? activities[activities.length - 1].created_at
          : null,
    };

    return NextResponse.json({
      data: {
        activities,
        summary,
      },
    });
  } catch (error) {
    console.error('Error in my-journey API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
