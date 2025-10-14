import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Debug endpoint to see what cookies are available
export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  return NextResponse.json({
    cookies: allCookies.map(cookie => ({
      name: cookie.name,
      valueLength: cookie.value?.length || 0,
      hasValue: !!cookie.value,
    })),
    allCookieNames: allCookies.map(c => c.name),
  });
}
