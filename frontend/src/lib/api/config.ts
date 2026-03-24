const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const API_BASE = `${BASE_URL}/api`;

export const CACHE_TAGS = {
  universities:      'universities',
  university:        (id: number) => `university-${id}`,
  stats:             'dashboard-stats',
  jobs:              'jobs',
} as const;


async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & {
    tags?:     string[];
    revalidate?: number | false;
  }
): Promise<T> {
  const { tags, revalidate, ...fetchOptions } = options ?? {};

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions?.headers,
    },
    next: {
      // Next.js 14 cache options
      ...(tags      && { tags }),
      ...(revalidate !== undefined && { revalidate }),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export default apiFetch;
