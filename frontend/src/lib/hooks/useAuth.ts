'use client';

import useSWR, { useSWRConfig } from 'swr';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { User } from '@/lib/auth/config';
import { AUTH_REDIRECT } from '@/lib/auth/config';

interface MeResponse {
  success:  boolean;
  data?: { user: User; expiresAt: number };
  message?: string;
}

async function fetcher(url: string): Promise<MeResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `${res.status}`);
  }
  return res.json();
}

export function useAuth() {
  const router       = useRouter();
  const { mutate }   = useSWRConfig();

  const { data, error, isLoading } = useSWR<MeResponse>(
    '/api/auth/me',
    fetcher,
    {
      revalidateOnFocus:     false,
      shouldRetryOnError:    false,  // 401 = not logged in, don't retry
      dedupingInterval:      60_000, // cache for 1 minute
    }
  );

  const isAuthenticated = !error && !!data?.data?.user;
  const user            = data?.data?.user ?? null;

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
    } finally {
      await mutate(() => true, undefined, { revalidate: false });
      router.push(AUTH_REDIRECT);
      router.refresh();
    }
  }, [mutate, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
  };
}
