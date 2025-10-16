import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - API routes (/api/*)
  // - Static files (/_next/*, /favicon.ico, etc.)
  // - Files with extensions (*.jpg, *.css, etc.)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
