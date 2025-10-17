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
  sessionId: string; // Unique ID for each tracking session
}

/**
 * GET /api/events/[slug]/tracking-paths
 * Fetch tracking paths (polylines) for all users in a event
 * Separates paths by tracking sessions (breaks polylines when there's a time gap > 2 minutes)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { slug } = await params;

    // Get event by slug
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch all location and tracking activities for the event (chronological order)
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activity')
      .select('user_id, data, created_at')
      .eq('event_id', event.id)
      .in('activity_type', ['location', 'tracking'])
      .order('user_id', { ascending: true })
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

    // Group coordinates by user and tracking session
    // Break into separate paths when there's a time gap > 2 minutes
    const MAX_GAP_MS = 2 * 60 * 1000; // 2 minutes
    const paths: TrackingPath[] = [];

    let currentPath: TrackingPath | null = null;
    let lastTimestamp: Date | null = null;

    activities.forEach(activity => {
      const userId = activity.user_id;
      const locationData = activity.data as { lat: number; long: number };
      const timestamp = new Date(activity.created_at || new Date());

      // Check if we should start a new path (new user or time gap)
      const isNewUser = currentPath && currentPath.userId !== userId;
      const hasTimeGap =
        lastTimestamp &&
        currentPath &&
        timestamp.getTime() - lastTimestamp.getTime() > MAX_GAP_MS;

      if (isNewUser || hasTimeGap) {
        // Save the previous path if it has at least 2 points
        // We know currentPath is not null here because of the conditions above
        if (currentPath!.coordinates.length >= 2) {
          paths.push(currentPath!);
        }
        currentPath = null; // Reset for new path
      }

      // Start a new path if needed
      if (!currentPath) {
        const userIndex = uniqueUserIds.indexOf(userId);
        currentPath = {
          userId,
          userName: profileMap.get(userId) || undefined,
          coordinates: [],
          color: TRACKING_COLORS[userIndex % TRACKING_COLORS.length],
          sessionId: `${userId}-${timestamp.getTime()}`,
        };
      }

      // Add coordinate to current path
      currentPath.coordinates.push({
        lat: locationData.lat,
        lng: locationData.long,
        timestamp: activity.created_at || new Date().toISOString(),
      });

      lastTimestamp = timestamp;
    });

    // Add the last path if it has at least 2 points
    if (currentPath) {
      const path: TrackingPath = currentPath;
      if (path.coordinates.length >= 2) {
        paths.push(path);
      }
    }

    return NextResponse.json({ data: paths });
  } catch (error) {
    console.error('Error in tracking-paths API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
