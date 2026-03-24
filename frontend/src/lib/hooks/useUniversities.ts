'use client';

import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import type {
  UniversityQuery,
  PaginatedResponse,
  UniversityListItem,
  ApiResponse,
  UniversityDetail,
  CreateUniversityInput,
  UpdateUniversityInput,
  TriggerResponse,
} from '@/types/api';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message
        ? `${res.status} ${body.message}`
        : `${res.status} ${res.statusText}`
    );
  }
  return res.json() as Promise<T>;
}

async function mutationFetcher<T>(
  url: string,
  { arg }: { arg: { method: string; body?: unknown } }
): Promise<T> {
  const res = await fetch(url, {
    method:  arg.method,
    headers: { 'Content-Type': 'application/json' },
    body:    arg.body ? JSON.stringify(arg.body) : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message
        ? `${res.status} ${body.message}`
        : `${res.status} ${res.statusText}`
    );
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

function buildQs(query: UniversityQuery): string {
  const p = new URLSearchParams();
  if (query.page)   p.set('page',   String(query.page));
  if (query.limit)  p.set('limit',  String(query.limit));
  if (query.search) p.set('search', query.search);
  if (query.type)   p.set('type',   query.type);
  if (query.sortBy) p.set('sortBy', query.sortBy);
  if (query.order)  p.set('order',  query.order);
  return p.toString() ? `?${p}` : '';
}

export function useUniversities(query: UniversityQuery = {}) {
  const key = `${API}/api/universities${buildQs(query)}`;
  return useSWR<PaginatedResponse<UniversityListItem>>(key, fetcher, {
    keepPreviousData:   true,
    revalidateOnFocus:  false,
  });
}

export function useUniversity(id: number | null) {
  return useSWR<ApiResponse<UniversityDetail>>(
    id ? `${API}/api/universities/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
}

export function useCreateUniversity() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    `${API}/api/universities`,
    (url, { arg }: { arg: CreateUniversityInput }) =>
      mutationFetcher<ApiResponse<UniversityDetail>>(url, {
        arg: { method: 'POST', body: arg },
      }),
    {
      onSuccess: () => {
        mutate(
          (key: unknown) =>
            typeof key === 'string' &&
            (key.includes('/api/universities') || key.includes('/api/universities/stats')),
          undefined,
          { revalidate: true }
        );
      },
    }
  );
}

export function useUpdateUniversity(id: number) {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    `${API}/api/universities/${id}`,
    (url, { arg }: { arg: UpdateUniversityInput }) =>
      mutationFetcher<ApiResponse<UniversityDetail>>(url, {
        arg: { method: 'PATCH', body: arg },
      }),
    {
      onSuccess: () => {
        mutate(`${API}/api/universities/${id}`);
        mutate(
          (key: unknown) =>
            typeof key === 'string' && key.includes('/api/universities'),
          undefined,
          { revalidate: true }
        );
      },
    }
  );
}

export function useDeleteUniversity() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    `${API}/api/universities`,
    (_: string, { arg }: { arg: number }) =>
      mutationFetcher<null>(`${API}/api/universities/${arg}`, {
        arg: { method: 'DELETE' },
      }),
    {
      onSuccess: () => {
        mutate(
          (key: unknown) =>
            typeof key === 'string' && key.includes('/api/universities'),
          undefined,
          { revalidate: true }
        );
      },
    }
  );
}

export function useTriggerScrape() {
  return useSWRMutation(
    `${API}/api/scrape`,
    (
      _: string,
      { arg }: { arg: { id: number; retryEnabled?: boolean; maxAttempts?: number } }
    ) =>
      mutationFetcher<ApiResponse<TriggerResponse>>(
        `${API}/api/scrape/${arg.id}`,
        {
          arg: {
            method: 'POST',
            body:   {
              retryEnabled: arg.retryEnabled,
              maxAttempts:  arg.maxAttempts,
            },
          },
        }
      )
  );
}

export function useTriggerScrapeAll() {
  return useSWRMutation(
    `${API}/api/scrape/all`,
    (url: string) =>
      mutationFetcher<ApiResponse<{ message: string }>>(url, {
        arg: { method: 'POST' },
      })
  );
}
