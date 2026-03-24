'use client';

import useSWR from 'swr';
import type { ApiResponse, ScrapeJob, PaginatedResponse, ScrapeStatus } from '@/types/api';

const API    = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const ACTIVE: ScrapeStatus[] = ['PENDING', 'RUNNING', 'RETRYING'];

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? `${res.status} ${res.statusText}`
    );
  }
  return res.json() as Promise<T>;
}

export function useJobPoller(jobId: number | null) {
  return useSWR<ApiResponse<ScrapeJob>>(
    jobId ? `${API}/api/jobs/${jobId}` : null,
    fetcher,
    {
      refreshInterval: (data) => {
        if (!data?.data) return 2000;
        return ACTIVE.includes(data.data.status) ? 2000 : 0;
      },
      revalidateOnFocus:  false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
    }
  );
}

export function useJobs(params?: {
  page?:   number;
  limit?:  number;
  status?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.page)   qs.set('page',   String(params.page));
  if (params?.limit)  qs.set('limit',  String(params.limit));
  if (params?.status) qs.set('status', params.status);

  const key = `${API}/api/jobs${qs.toString() ? `?${qs}` : ''}`;

  return useSWR<PaginatedResponse<ScrapeJob>>(key, fetcher, {
    refreshInterval:  5000,
    keepPreviousData: true,
    revalidateOnFocus: false,
  });
}
