import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, AUTH_REDIRECT, PUBLIC_ROUTES } from '@/lib/auth/config';


export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isPublic) return NextResponse.next();

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')          
  ) {
    return NextResponse.next();
  }

  // Check session cookie presence 
  const sessionCookie = req.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    const loginUrl = new URL(AUTH_REDIRECT, req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
