import type { ApiResponse, PaginatedResponse, ScrapeJob } from '@/types/api';
import apiFetch, { CACHE_TAGS } from './config';

export async function getJobs(params?: {
  page?:         number;
  limit?:        number;
  status?:       string;
  universityId?: number;
}): Promise<PaginatedResponse<ScrapeJob>> {
  const qs = new URLSearchParams();
  if (params?.page)         qs.set('page',         String(params.page));
  if (params?.limit)        qs.set('limit',        String(params.limit));
  if (params?.status)       qs.set('status',       params.status);
  if (params?.universityId) qs.set('universityId', String(params.universityId));

  return apiFetch<PaginatedResponse<ScrapeJob>>(
    `/jobs${qs.toString() ? `?${qs}` : ''}`,
    {
      tags:       [CACHE_TAGS.jobs],
      revalidate: 10,
    }
  );
}

export async function getJob(jobId: number): Promise<ApiResponse<ScrapeJob>> {
  return apiFetch<ApiResponse<ScrapeJob>>(
    `/jobs/${jobId}`,
    { revalidate: 0 } // always fresh for polling
  );
}
