// ─────────────────────────────────────────────────────────────────────────────
// Auth Session Helpers (Server-side only)
//
// Uses Next.js cookies() / headers() from next/headers.
// Called only from Server Components, Route Handlers, and middleware.
// ─────────────────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers';
import type { Session, User } from './config';
import { SESSION_COOKIE, SESSION_TTL_MS, MOCK_USERS } from './config';

// ── Encode / decode session ───────────────────────────────────────────────────
// Using base64 JSON — simple for mock auth.
// Real implementation: sign with a secret using jose or iron-session.

function encode(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

function decode(raw: string): Session | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
    if (!parsed?.user?.id || !parsed?.expiresAt) return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

// ── Read session from cookie ──────────────────────────────────────────────────
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = cookies();
    const raw         = cookieStore.get(SESSION_COOKIE)?.value;
    if (!raw) return null;

    const session = decode(raw);
    if (!session) return null;

    // Check expiry
    if (Date.now() > session.expiresAt) return null;

    return session;
  } catch {
    return null;
  }
}

// ── Get current user (throws if not authenticated) ────────────────────────────
export async function requireUser(): Promise<User> {
  const session = await getSession();
  if (!session) {
    // Will be caught by the caller (Server Component or Route Handler)
    throw new Error('UNAUTHENTICATED');
  }
  return session.user;
}

// ── Validate credentials against mock store ───────────────────────────────────
export function validateCredentials(
  email: string,
  password: string
): User | null {
  const found = MOCK_USERS.find(
    u =>
      u.email.toLowerCase() === email.toLowerCase().trim() &&
      u._password === password
  );

  if (!found) return null;

  // Return user without password
  const { _password: _p, ...user } = found;
  return user;
}

// ── Create session value (for route handler to set as cookie) ─────────────────
export function createSessionValue(user: User): string {
  const session: Session = {
    user,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  return encode(session);
}
