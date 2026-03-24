import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Globe, MapPin, AlertCircle } from 'lucide-react';
import { getUniversity } from '@/lib/api/universities';
import { Badge, typeToBadge } from '@/components/ui/Badge';
import {
  AdmissionSection,
  FeesSection,
  EligibilitySection,
  ScholarshipsSection,
} from '@/components/university/detail/DataSections';
import { ScrapeOneButton } from '@/components/university/ScrapeButton';
import DetailActions from '@/components/university/detail/DetailActions';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import type { UniversityDetail } from '@/types/api';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { data } = await getUniversity(Number(params.id));
    return {
      title:       data.name,
      description: data.description ?? `Admission, tuition and scholarship data for ${data.name}`,
    };
  } catch {
    return { title: 'University not found' };
  }
}

function SectionSkeleton() {
  return (
    <div
      className="rounded-[var(--radius-lg)] overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
    >
      <div
        className="px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <Skeleton height={16} width="140px" />
      </div>
      <div className="p-5 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <Skeleton height={13} width="110px" />
            <Skeleton height={13} width="55%" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableSectionSkeleton() {
  return (
    <div
      className="rounded-[var(--radius-lg)] overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
    >
      <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <Skeleton height={16} width="100px" />
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ background: 'var(--bg-subtle)' }}>
            {[200, 100, 60, 100].map((w, i) => (
              <th key={i} className="px-5 py-2.5 text-left">
                <Skeleton height={11} width={w} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(4)].map((_, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              {[...Array(4)].map((_, j) => (
                <td key={j} className="px-5 py-3">
                  <Skeleton height={13} width={j === 0 ? '80%' : '60%'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function AdmissionStream({ uni }: { uni: UniversityDetail }) {
  return <AdmissionSection data={uni.admission} />;
}

async function EligibilityStream({ uni }: { uni: UniversityDetail }) {
  return <EligibilitySection data={uni.eligibility} />;
}

async function FeesStream({ uni }: { uni: UniversityDetail }) {
  return <FeesSection data={uni.tuitionFees} />;
}

async function ScholarshipsStream({ uni }: { uni: UniversityDetail }) {
  return <ScholarshipsSection data={uni.scholarships} />;
}

async function ScrapeHistoryStream({ uni }: { uni: UniversityDetail }) {
  if (!uni.scrapeJobs.length) return null;
  return (
    <div
      className="mt-5 rounded-[var(--radius-lg)] overflow-hidden bg-glow-top"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
    >
      <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Scrape history
        </h3>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ background: 'var(--bg-subtle)' }}>
            {['Job', 'Status', 'Accuracy', 'Strategy', 'Duration'].map(h => (
              <th
                key={h}
                className="text-left px-5 py-2.5 text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {uni.scrapeJobs.map(job => {
            const dur =
              job.startedAt && job.completedAt
                ? Math.round(
                    (new Date(job.completedAt).getTime() -
                      new Date(job.startedAt).getTime()) / 1000
                  )
                : null;
            return (
              <tr
                key={job.id}
                className="hover:bg-[var(--bg-subtle)] transition-colors"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  #{job.id}
                </td>
                <td className="px-5 py-3">
                  <Badge label={job.status} variant={job.status.toLowerCase() as never} />
                </td>
                <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>
                  {job.accuracyScore != null ? `${Math.round(job.accuracyScore)}%` : '—'}
                </td>
                <td className="px-5 py-3">
                  <span
                    className="font-mono text-xs px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
                  >
                    {job.strategy ?? '—'}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {dur != null ? `${dur}s` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function UniversityDetailPage({ params }: PageProps) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  let uni: UniversityDetail;
  try {
    const res = await getUniversity(id);
    uni = res.data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Not found';
    if (msg.includes('404') || msg.includes('not found') || msg.includes('P2025')) {
      notFound();
    }
    throw err;
  }

  const latestJob = uni.scrapeJobs?.[0];

  return (
    <div className=" py-8 px-4 lg:px-8 w-full">
  
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-xs mb-6"
        aria-label="Breadcrumb"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Link
          href="/universities"
          className="transition-colors hover:underline"
          style={{ color: 'var(--brand)' }}
        >
          Universities
        </Link>
        <ChevronRight size={12} />
        <span style={{ color: 'var(--text-secondary)' }}>{uni.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1
              className="text-2xl font-semibold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {uni.name}
            </h1>
            <Badge label={uni.type} variant={typeToBadge(uni.type)} size="md" />
            {!uni.scrapeable && (
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{
                  color:      'var(--warning-text)',
                  background: 'var(--warning-subtle)',
                }}
              >
                <AlertCircle size={11} /> Manual only
              </span>
            )}
          </div>

          <div
            className="flex items-center gap-4 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {uni.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} style={{ color: 'var(--text-tertiary)' }} />
                {uni.location}
              </span>
            )}
            <a
              href={uni.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:underline"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Globe size={13} style={{ color: 'var(--text-tertiary)' }} />
              {uni.website.replace(/^https?:\/\//, '')}
            </a>
          </div>

          {uni.description && (
            <p
              className="text-sm mt-2 max-w-2xl"
              style={{ color: 'var(--text-secondary)' }}
            >
              {uni.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {uni.scrapeable && <ScrapeOneButton universityId={uni.id} size="sm" />}
          <DetailActions university={uni} />
        </div>
      </div>

      {/* Accuracy bar */}
      {latestJob?.accuracyScore != null && (
        <div
          className="mb-6 p-4 rounded-[var(--radius-lg)] flex items-center gap-4 bg-glow-top"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <div className="flex-1">
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Last scrape accuracy
            </p>
            <div className="flex items-center gap-3">
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: 'var(--bg-subtle)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width:      `${latestJob.accuracyScore}%`,
                    background:
                      latestJob.accuracyScore >= 75
                        ? 'var(--success)'
                        : latestJob.accuracyScore >= 50
                          ? 'var(--warning)'
                          : 'var(--danger)',
                  }}
                />
              </div>
              <span
                className="text-sm font-semibold w-10 text-right"
                style={{ color: 'var(--text-primary)' }}
              >
                {Math.round(latestJob.accuracyScore)}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Fields found</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {latestJob.fieldsFound} / 4
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Strategy</p>
            <span
              className="font-mono text-xs px-2 py-0.5 rounded"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
            >
              {latestJob.strategy ?? '—'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ErrorBoundary context="Admission information">
          <Suspense fallback={<SectionSkeleton />}>
            <AdmissionStream uni={uni} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary context="Eligibility criteria">
          <Suspense fallback={<SectionSkeleton />}>
            <EligibilityStream uni={uni} />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="mt-5">
        <ErrorBoundary context="Tuition fees">
          <Suspense fallback={<TableSectionSkeleton />}>
            <FeesStream uni={uni} />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="mt-5">
        <ErrorBoundary context="Scholarships">
          <Suspense fallback={<SectionSkeleton />}>
            <ScholarshipsStream uni={uni} />
          </Suspense>
        </ErrorBoundary>
      </div>

      <ErrorBoundary context="Scrape history">
        <Suspense fallback={null}>
          <ScrapeHistoryStream uni={uni} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
