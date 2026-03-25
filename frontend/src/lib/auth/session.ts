
import { cookies } from 'next/headers';
import type { Session, User } from './config';
import { SESSION_COOKIE, SESSION_TTL_MS, MOCK_USERS } from './config';

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

export async function requireUser(): Promise<User> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHENTICATED');
  }
  return session.user;
}

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

export function createSessionValue(user: User): string {
  const session: Session = {
    user,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  return encode(session);
}
