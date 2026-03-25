'use server';

import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/api/config';

export async function revalidateUniversity(universityId: number) {
  revalidateTag(CACHE_TAGS.university(universityId));
  revalidateTag(CACHE_TAGS.universities);
  revalidateTag(CACHE_TAGS.stats);
}


export async function revalidateDashboard() {  
  revalidateTag(CACHE_TAGS.stats);
  revalidateTag(CACHE_TAGS.universities);
  revalidateTag(CACHE_TAGS.jobs);
}