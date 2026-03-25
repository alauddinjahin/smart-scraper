'use client';

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useJobPoller } from '@/lib/hooks/useJob';
import { useTriggerScrape, useTriggerScrapeAll } from '@/lib/hooks/useUniversities';
import { useSWRConfig } from 'swr';
import { useRouter } from 'next/navigation';
import { revalidateDashboard, revalidateUniversity } from '@/app/actions/revalidate';

const ACTIVE_STATUSES = ['PENDING', 'RUNNING', 'RETRYING'];

interface ScrapeButtonProps {
  universityId: number;
  onComplete?:  () => void;
  size?:        'xs' | 'sm' | 'md';
}

export function ScrapeOneButton({ universityId, onComplete, size = 'sm' }: ScrapeButtonProps) {
  const [jobId, setJobId] = useState<number | null>(null);
  const [done,  setDone]  = useState(false);
  

  const { trigger, isMutating } = useTriggerScrape();
  const { mutate }              = useSWRConfig();
  const toast                   = useToast();
  const router = useRouter();

  const { data: jobData, error: pollError } = useJobPoller(jobId);
  const status = jobData?.data?.status;

  useEffect(() => {
    if (!jobId || done) return;

    if (status === 'COMPLETED') {
      setDone(true);
      setJobId(null);
      toast.success('Scrape completed successfully!');

      const handleCompleted = async () =>{
        mutate(
          (key: string) =>
            typeof key === 'string' &&
            (key.includes(`/universities/${universityId}`) ||
            key.includes('/universities?') ||
            key.includes('/universities/stats')),
          undefined,
          { revalidate: true }
        );
        onComplete?.();

        await revalidateUniversity(universityId);
        router.refresh();
      }

      handleCompleted();
      
      
      
    }

    if (status === 'FAILED') {
      setDone(true);
      setJobId(null);
      const errMsg = jobData?.data?.errorLog ?? 'Unknown error';
      toast.error(`Scrape failed: ${errMsg}`);
    }
  }, [status, jobId, done, mutate, toast, universityId, onComplete, jobData]);

  useEffect(() => {
    if (!pollError || !jobId) return;
    toast.warn('Lost connection while monitoring scrape. Check Jobs page for status.');
    setJobId(null);
  }, [pollError, jobId, toast]);

  const isRunning =
    isMutating ||
    (!!jobId && ACTIVE_STATUSES.includes(status ?? ''));

  const handleScrape = useCallback(async () => {
    setDone(false);
    try {
      const res = await trigger({ id: universityId });
      if (res?.data?.jobId) setJobId(res.data.jobId);
      toast.info('Scrape job queued…');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to start scrape');
    }
  }, [trigger, universityId, toast]);

  return (
    <Button
      variant="primary"
      size={size}
      loading={isRunning}
      leftIcon={<RefreshCw size={13} />}
      onClick={handleScrape}
      disabled={isRunning}
      aria-label={isRunning ? 'Scraping in progress' : 'Start scrape'}
    >
      {isRunning ? 'Scraping…' : 'Scrape'}
    </Button>
  );
}


interface ScrapeAllButtonProps {
  onComplete?: () => void; // ← add this
}

export default function ScrapeAllButton({ onComplete }: ScrapeAllButtonProps) {
  const { trigger, isMutating } = useTriggerScrapeAll();
  const toast = useToast();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  
  const handleAll = async () => {
    try {
      await trigger();
      toast.success('Bulk scrape queued. Jobs are running in the background.');

       // Revalidate SWR client cache
      mutate(
        (key: string) =>
          typeof key === 'string' &&
          (key.includes('/universities?') ||
            key.includes('/universities/stats')),
        undefined,
        { revalidate: true }
      );

      await revalidateDashboard();
      router.refresh();
      
      onComplete?.(); 

    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to trigger bulk scrape');
    }
  };

  return (
    <Button
      variant="primary"
      size="md"
      loading={isMutating}
      leftIcon={<Zap size={14} />}
      onClick={handleAll}
      aria-label="Scrape all universities"
    >
      Scrape all
    </Button>
  );
}
