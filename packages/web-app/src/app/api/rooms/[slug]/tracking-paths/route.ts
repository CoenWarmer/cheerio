import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

const TRACKING_COLORS = [
  '#FF6B35', // Bright Orange
  '#FF006E', // Hot Pink
  '#00F5FF', // Cyan/Aqua
  '#FFBE0B', // Electric Yellow
  '#8338EC', // Bright Purple
  '#06FFA5', // Neon Green
  '#FB5607', // Vibrant Orange-Red
  '#FF006E', // Magenta
];

interface TrackingPath {
  userId: string;
  userName?: string;
  coordinates: Array<{ lat: number; lng: number; timestamp: string }>;
  color: string;
}

/**
 * GET /api/rooms/[slug]/tracking-paths
 * Fetch tracking paths (polylines) for all users in a room
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { slug } = await params;

    // Get room by slug
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('slug', slug)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Fetch all location activities for the room (chronological order)
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activity')
      .select('user_id, data, created_at')
      .eq('room_id', room.id)
      .eq('activity_type', 'location')
      .order('created_at', { ascending: true });

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return NextResponse.json(
        { error: activitiesError.message },
        { status: 500 }
      );
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get unique user IDs
    const uniqueUserIds = Array.from(new Set(activities.map(a => a.user_id)));

    // Fetch user profiles for display names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', uniqueUserIds);

    const profileMap = new Map(
      profiles?.map(p => [p.id, p.display_name]) || []
    );

    // Group coordinates by user
    const pathsByUser = new Map<string, TrackingPath>();

    activities.forEach(activity => {
      const userId = activity.user_id;
      const locationData = activity.data as { lat: number; long: number };

      if (!pathsByUser.has(userId)) {
        const userIndex = uniqueUserIds.indexOf(userId);
        pathsByUser.set(userId, {
          userId,
          userName: profileMap.get(userId) || undefined,
          coordinates: [],
          color: TRACKING_COLORS[userIndex % TRACKING_COLORS.length],
        });
      }

      pathsByUser.get(userId)!.coordinates.push({
        lat: locationData.lat,
        lng: locationData.long,
        timestamp: activity.created_at || new Date().toISOString(),
      });
    });

    const paths = Array.from(pathsByUser.values());

    return NextResponse.json({ data: paths });
  } catch (error) {
    console.error('Error in tracking-paths API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
