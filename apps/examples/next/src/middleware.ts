import { NextResponse, type NextRequest } from 'next/server';
import { checkConsentCookie } from '~/lib/cookieConsentUtil';

/**
 * Middleware that checks for consent before allowing access to protected routes
 */
export function middleware(request: NextRequest) {
  // Check if the user has consented
  const hasConsented = checkConsentCookie(request, {
    requiredConsent: ['analytics']
  });
  
  // If no consent and trying to access protected route, redirect to consent page
  if (!hasConsented && request.nextUrl.pathname.startsWith('/protected')) {
    return NextResponse.redirect(new URL('/consent', request.url));
  }
  
  // Allow the request to continue
  return NextResponse.next();
}

/**
 * Configure which routes this middleware runs on
 */
export const config = {
  matcher: ['/protected/:path*']
}; 