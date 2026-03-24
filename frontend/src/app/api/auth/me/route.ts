import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, data: { user: session.user, expiresAt: session.expiresAt } },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[auth/me]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
