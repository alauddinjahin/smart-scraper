import { NextResponse } from 'next/server';
import { SESSION_COOKIE, AUTH_REDIRECT } from '@/lib/auth/config';

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, data: { redirectTo: AUTH_REDIRECT } },
      { status: 200 }
    );

    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   0,
      path:     '/',
    });

    return response;
  } catch (err: unknown) {
    console.error('[auth/logout]', err);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
