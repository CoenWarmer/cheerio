import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

interface LocationActivity {
  lat: number;
  long: number;
  accuracy?: number;
}

interface SpeedActivity {
  speed: number;
  unit: 'kmh' | 'mph';
}

interface DistanceActivity {
  distance: number;
  unit: 'km' | 'miles';
}

interface MusicActivity {
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  service?: 'spotify' | 'apple' | 'manual';
}

interface TrackingActivity {
  lat: number;
  long: number;
  accuracy?: number;
  timestamp?: number;
  speed?: number;
  distance?: number;
}

interface UserActivitySummary {
  userId: string;
  userName?: string;
  lastLocation?: {
    lat: number;
    long: number;
    accuracy?: number;
    timestamp: string;
  };
  lastSpeed?: {
    speed: number;
    unit: 'kmh' | 'mph';
    timestamp: string;
  };
  lastDistance?: {
    distance: number;
    unit: 'km' | 'miles';
    timestamp: string;
  };
  lastMusic?: {
    title: string;
    artist: string;
    album?: string;
    coverUrl?: string;
    service?: 'spotify' | 'apple' | 'manual';
    timestamp: string;
  };
}

/**
 * GET /api/events/[slug]/activity-summary
 * Fetch processed activity summaries for users in a event
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

    // Get current user to exclude from summaries
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '200');

    // Fetch activities
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activity')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })
      .limit(limit);

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

    // Get unique user IDs (excluding current user)
    const uniqueUserIds = Array.from(
      new Set(activities.map(a => a.user_id))
    ).filter(id => id !== user?.id);

    // Fetch user profiles
    const userProfilesMap = new Map<string, string>();
    if (uniqueUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', uniqueUserIds);

      if (!profilesError && profiles) {
        profiles.forEach(profile => {
          if (profile.display_name) {
            userProfilesMap.set(profile.id, profile.display_name);
          }
        });
      }
    }

    // Process activities into summaries
    const summaries = new Map<string, UserActivitySummary>();

    activities.forEach(activity => {
      const userId = activity.user_id;

      // Skip current user
      if (userId === user?.id) return;

      if (!summaries.has(userId)) {
        summaries.set(userId, {
          userId,
          userName: userProfilesMap.get(userId),
        });
      }

      const summary = summaries.get(userId)!;

      switch (activity.activity_type) {
        case 'tracking': {
          // New consolidated tracking activity (contains location, speed, and distance)
          const trackingData = activity.data as unknown as TrackingActivity;
          const timestamp = activity.created_at || new Date().toISOString();

          if (!summary.lastLocation) {
            summary.lastLocation = {
              lat: trackingData.lat,
              long: trackingData.long,
              accuracy: trackingData.accuracy,
              timestamp,
            };
          }

          if (!summary.lastSpeed && trackingData.speed !== undefined) {
            summary.lastSpeed = {
              speed: trackingData.speed,
              unit: 'kmh',
              timestamp,
            };
          }

          if (!summary.lastDistance && trackingData.distance !== undefined) {
            summary.lastDistance = {
              distance: trackingData.distance,
              unit: 'km',
              timestamp,
            };
          }
          break;
        }
        case 'location': {
          // Legacy: Keep support for old location-only activities
          if (!summary.lastLocation) {
            const locationData = activity.data as unknown as LocationActivity;
            summary.lastLocation = {
              lat: locationData.lat,
              long: locationData.long,
              accuracy: locationData.accuracy,
              timestamp: activity.created_at || new Date().toISOString(),
            };
          }
          break;
        }
        case 'speed': {
          // Legacy: Keep support for old speed-only activities
          if (!summary.lastSpeed) {
            const speedData = activity.data as unknown as SpeedActivity;
            summary.lastSpeed = {
              speed: speedData.speed,
              unit: speedData.unit,
              timestamp: activity.created_at || new Date().toISOString(),
            };
          }
          break;
        }
        case 'distance': {
          // Legacy: Keep support for old distance-only activities
          if (!summary.lastDistance) {
            const distanceData = activity.data as unknown as DistanceActivity;
            summary.lastDistance = {
              distance: distanceData.distance,
              unit: distanceData.unit,
              timestamp: activity.created_at || new Date().toISOString(),
            };
          }
          break;
        }
        case 'music': {
          if (!summary.lastMusic) {
            const musicData = activity.data as unknown as MusicActivity;
            summary.lastMusic = {
              title: musicData.title,
              artist: musicData.artist,
              album: musicData.album,
              coverUrl: musicData.coverUrl,
              service: musicData.service,
              timestamp: activity.created_at || new Date().toISOString(),
            };
          }
          break;
        }
      }
    });

    // Convert Map to Array
    const summariesArray = Array.from(summaries.values());

    return NextResponse.json({ data: summariesArray });
  } catch (error) {
    console.error('Error in activity-summary API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
