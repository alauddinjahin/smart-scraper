'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[error boundary]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--danger-subtle)] flex items-center justify-center mb-4">
        <AlertTriangle size={22} className="text-[var(--danger-text)]" />
      </div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
        {error.message ?? 'An unexpected error occurred. Please try again.'}
      </p>
      <Button
        variant="primary"
        size="md"
        leftIcon={<RefreshCw size={14} />}
        onClick={reset}
      >
        Try again
      </Button>
    </div>
  );
}
