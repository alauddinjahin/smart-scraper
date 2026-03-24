import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { CACHE_TAGS } from '@/lib/api/config';

export async function POST(req: NextRequest) {
  const { tag } = await req.json().catch(() => ({}));

  if (tag === 'universities') {
    revalidateTag(CACHE_TAGS.universities);
    revalidateTag(CACHE_TAGS.stats);
    return NextResponse.json({ revalidated: true, tag });
  }

  if (typeof tag === 'string' && tag.startsWith('university-')) {
    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag });
  }

  return NextResponse.json({ error: 'Invalid tag' }, { status: 400 });
}
