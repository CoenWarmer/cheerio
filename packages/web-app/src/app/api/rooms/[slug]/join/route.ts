import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * POST /api/rooms/[slug]/join
 * Adds the current user as a member of the specified room
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Get room by slug to get the room ID
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('slug', slug)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const roomId = room.id;

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    // If already a member, return success
    if (existingMember) {
      console.log(
        `Join API - User ${user.id} is already a member of room ${roomId}`
      );
      return NextResponse.json({
        success: true,
        alreadyMember: true,
      });
    }

    // Add user as a member
    console.log(
      `Join API - Adding user ${user.id} to room ${roomId} (slug: ${slug})`
    );
    const { data, error } = await supabase
      .from('room_members')
      .insert({
        room_id: roomId,
        user_id: user.id,
        role: 'member', // Default role
      })
      .select()
      .single();

    if (error) {
      console.error('Join API - Error joining room:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Join API - Successfully added user ${user.id} to room:`, data);

    return NextResponse.json({
      success: true,
      member: data,
    });
  } catch (error) {
    console.error('Error in join room API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
