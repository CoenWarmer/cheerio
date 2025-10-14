import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * GET /api/profiles?ids=uuid1,uuid2,uuid3
 * Fetch user profiles by IDs
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get current user for auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'ids parameter is required' },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',');

    // Fetch profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, permissions')
      .in('id', ids);

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in profiles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
