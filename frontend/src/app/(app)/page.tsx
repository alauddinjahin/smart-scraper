import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getDashboardStats } from '@/lib/api/universities';
import StatsGrid from '@/components/dashboard/StatsGrid';
import RecentJobs from '@/components/dashboard/RecentJobs';
import { Skeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ScrapeAllButton from '@/components/university/ScrapeButton';
import ScraperAllButtonWraper from '@/components/dashboard/ScraperAllButtonWraper';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

async function StatsSection() {
  const { data } = await getDashboardStats();
  return <StatsGrid stats={data} />;
}

async function JobsSection() {
  const { data } = await getDashboardStats();
  return <RecentJobs jobs={data.recentJobs ?? []} />;
}

function StatsSkeleton() {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
    >
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-lg)] p-5 space-y-3"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <Skeleton height={12} width="60%" />
          <Skeleton height={32} width="40%" />
          <Skeleton height={10} width="70%" />
        </div>
      ))}
    </div>
  );
}

function JobsSkeleton() {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {[...Array(5)].map((_, i) => (
          <TableRowSkeleton key={i} cols={5} />
        ))}
      </tbody>
    </table>
  );
}

export default function DashboardPage() {
  return (
    <div className="py-8 px-4 lg:px-8 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            University data scraped from public and private institution websites
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/universities"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] text-sm font-medium border transition-colors"
            style={{
              borderColor: 'var(--border-md)',
              color: 'var(--text-primary)',
              background: 'var(--bg-surface)',
            }}
          >
            Manage universities
            <ArrowRight size={14} />
          </Link>
          <ScrapeAllButton />
          {/* <ScraperAllButtonWraper /> */}
        </div>
      </div>

      <section className="mb-8">
    
        <ErrorBoundary context="Dashboard stats">
          <Suspense fallback={<StatsSkeleton />}>
            <StatsSection />
          </Suspense>
        </ErrorBoundary>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Recent scrape jobs
          </h2>
          <Link
            href="/jobs"
            className="text-sm flex items-center gap-1 hover:underline"
            style={{ color: 'var(--brand)' }}
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div
          className="rounded-[var(--radius-lg)] overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <ErrorBoundary context="Recent jobs">
            <Suspense fallback={<div className="p-4"><JobsSkeleton /></div>}>
              <JobsSection />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>
    </div>
  );
}
