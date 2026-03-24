'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function UniversitiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[universities/error]', error);
  }, [error]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div
        className="flex flex-col items-center justify-center py-20 text-center rounded-[var(--radius-xl)] border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
          style={{ background: 'var(--danger-subtle)' }}
        >
          <AlertTriangle size={24} style={{ color: 'var(--danger-text)' }} />
        </div>
        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Failed to load universities
        </h2>
        <p
          className="text-sm mb-1 max-w-md"
          style={{ color: 'var(--text-secondary)' }}
        >
          {error.message ?? 'An error occurred while fetching university data.'}
        </p>
        {error.digest && (
          <p className="text-xs mb-6 font-mono" style={{ color: 'var(--text-tertiary)' }}>
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] text-sm font-medium transition-colors"
            style={{ background: 'var(--brand)', color: '#fff' }}
          >
            <RefreshCw size={14} /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] text-sm font-medium border transition-colors"
            style={{
              borderColor: 'var(--border-md)',
              color: 'var(--text-primary)',
              background: 'var(--bg-surface)',
            }}
          >
            <Home size={14} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
