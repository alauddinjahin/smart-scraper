import type {
  ApiResponse,
  PaginatedResponse,
  UniversityDetail,
  UniversityListItem,
  UniversityQuery,
  DashboardStats,
} from '@/types/api';
import apiFetch, { CACHE_TAGS } from './config';

export async function getUniversities(
  query: UniversityQuery = {}
): Promise<PaginatedResponse<UniversityListItem>> {
  const params = new URLSearchParams();
  if (query.page)   params.set('page',   String(query.page));
  if (query.limit)  params.set('limit',  String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.type)   params.set('type',   query.type);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.order)  params.set('order',  query.order);

  const qs = params.toString();
  return apiFetch<PaginatedResponse<UniversityListItem>>(
    `/universities${qs ? `?${qs}` : ''}`,
    {
      tags:       [CACHE_TAGS.universities],
      revalidate: 60, // revalidate every 60 seconds
    }
  );
}

export async function getUniversity(
  id: number
): Promise<ApiResponse<UniversityDetail>> {
  return apiFetch<ApiResponse<UniversityDetail>>(
    `/universities/${id}`,
    {
      tags:       [CACHE_TAGS.university(id), CACHE_TAGS.universities],
      revalidate: 30,
    }
  );
}

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return apiFetch<ApiResponse<DashboardStats>>(
    '/universities/stats',
    {
      tags:       [CACHE_TAGS.stats],
      revalidate: 30,
    }
  );
}
