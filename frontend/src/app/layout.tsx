import type { Metadata } from 'next';
import Providers from '@/components/layout/Providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title:       { default: 'UniScraper', template: '%s — UniScraper' },
  description: 'University admission, tuition, eligibility and scholarship data aggregator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
