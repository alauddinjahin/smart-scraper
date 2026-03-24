'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[jobs/error]', error);
  }, [error]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Scrape jobs
        </h1>
      </div>
      <div
        className="flex flex-col items-center justify-center py-16 rounded-[var(--radius-xl)] border text-center"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--danger-subtle)' }}
        >
          <AlertTriangle size={20} style={{ color: 'var(--danger-text)' }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Failed to load jobs
        </p>
        <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
          {error.message ?? 'An error occurred while fetching scrape jobs.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 h-8 px-3 rounded-[var(--radius-md)] text-xs font-medium transition-colors"
          style={{ background: 'var(--brand)', color: '#fff' }}
        >
          <RefreshCw size={12} /> Try again
        </button>
      </div>
    </div>
  );
}
