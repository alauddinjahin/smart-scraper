import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, createSessionValue } from '@/lib/auth/session';
import { SESSION_COOKIE, SESSION_TTL_MS, LOGIN_REDIRECT } from '@/lib/auth/config';

export async function POST(req: NextRequest) {
  try {
    let body: { email?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (email.trim().length > 254 || password.trim().length > 128) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 400 }
      );
    }

    await new Promise(r => setTimeout(r, 300));

    const user = validateCredentials(email, password);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const sessionValue = createSessionValue(user);

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user,
          redirectTo: LOGIN_REDIRECT,
        },
      },
      { status: 200 }
    );

    response.cookies.set(SESSION_COOKIE, sessionValue, {
      httpOnly: true,                          // not accessible via JS
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   SESSION_TTL_MS / 1000,         // seconds
      path:     '/',
    });

    return response;

  } catch (err: unknown) {
    console.error('[auth/login]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
