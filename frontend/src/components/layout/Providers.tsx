'use client';

import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { ToastProvider, useToast } from '@/components/ui/Toast';

function SWRProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        errorRetryCount:   2,

        shouldRetryOnError: (err: Error) => {
          const status = parseInt(err?.message ?? '', 10);
          if (status >= 400 && status < 500) return false;
          return true;
        },

        onError: (err: Error, key: string) => {
          const status = parseInt(err?.message ?? '', 10);
          if (status === 404) return;

          const dedupKey = `swr-error:${key}`;
          if (typeof window === 'undefined') return;
          if (sessionStorage.getItem(dedupKey)) return;
          sessionStorage.setItem(dedupKey, '1');
          setTimeout(() => sessionStorage.removeItem(dedupKey), 10_000);

          toast.error(
            status >= 500
              ? 'Server error — please try again shortly'
              : err.message ?? 'An unexpected error occurred'
          );
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SWRProvider>
        {children}
      </SWRProvider>
    </ToastProvider>
  );
}
