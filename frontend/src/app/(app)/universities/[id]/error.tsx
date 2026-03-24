'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UniversityDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[university/[id]/error]', error);
  }, [error]);

  const isNotFound =
    error.message?.toLowerCase().includes('not found') ||
    error.message?.includes('P2025');

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb stub */}
      <nav className="flex items-center gap-1.5 text-xs mb-6" style={{ color: 'var(--text-tertiary)' }}>
        <Link
          href="/universities"
          className="hover:underline transition-colors"
          style={{ color: 'var(--brand)' }}
        >
          Universities
        </Link>
        <span>/</span>
        <span>{isNotFound ? 'Not found' : 'Error'}</span>
      </nav>

      <div
        className="flex flex-col items-center justify-center py-20 text-center rounded-[var(--radius-xl)] border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
          style={{ background: isNotFound ? 'var(--bg-subtle)' : 'var(--danger-subtle)' }}
        >
          <AlertTriangle
            size={24}
            style={{ color: isNotFound ? 'var(--text-tertiary)' : 'var(--danger-text)' }}
          />
        </div>

        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {isNotFound ? 'University not found' : 'Failed to load university'}
        </h2>

        <p
          className="text-sm mb-1 max-w-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          {isNotFound
            ? 'This university may have been deleted or the URL is incorrect.'
            : error.message ?? 'An unexpected error occurred.'}
        </p>

        {error.digest && (
          <p className="text-xs mt-1 mb-4 font-mono" style={{ color: 'var(--text-tertiary)' }}>
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex items-center gap-3 mt-6">
          <Link
            href="/universities"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] text-sm font-medium border transition-colors"
            style={{
              borderColor: 'var(--border-md)',
              color: 'var(--text-primary)',
              background: 'var(--bg-surface)',
            }}
          >
            <ArrowLeft size={14} /> Back to list
          </Link>

          {!isNotFound && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] text-sm font-medium transition-colors"
              style={{ background: 'var(--brand)', color: '#fff' }}
            >
              <RefreshCw size={14} /> Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
