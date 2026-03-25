'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import ScrapeAllButton from '@/components/university/ScrapeButton';
import { revalidateDashboard } from '@/app/actions/revalidate';

export default function ScraperAllButtonWraper() {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleComplete = async () => {
    await revalidateDashboard();
    router.refresh(); 

    let elapsed = 0;
    intervalRef.current = setInterval(async () => {
      elapsed += 10_000;
      await revalidateDashboard();
      router.refresh();

      if (elapsed >= 5 * 60 * 1000) stopPolling(); // stop after 5 mins
    }, 10_000);
  };

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), []);

  return <ScrapeAllButton onComplete={handleComplete} />;
}