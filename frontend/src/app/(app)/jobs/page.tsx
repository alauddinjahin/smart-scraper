'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge, statusToBadge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { useJobs } from '@/lib/hooks/useJob';
import type { ScrapeJob } from '@/types/api';

const STATUS_OPTIONS = [
  { value: '',          label: 'All statuses' },
  { value: 'RUNNING',   label: 'Running'      },
  { value: 'PENDING',   label: 'Pending'      },
  { value: 'COMPLETED', label: 'Completed'    },
  { value: 'FAILED',    label: 'Failed'       },
  { value: 'RETRYING',  label: 'Retrying'     },
];

export default function JobsPage() {
  const [status, setStatus] = useState('');
  const [page,   setPage]   = useState(1);

  const { data, isLoading, error: fetchError, mutate } = useJobs({
    page,
    limit:  20,
    status: status || undefined,
  });

  const TH = 'text-left px-4 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap border-b'
    + ' bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border-[var(--border)]';
  const TD = 'px-4 py-3 text-sm border-b border-[var(--border)]';

  return (
    <div className="py-8 px-4 lg:px-8 w-full">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Scrape jobs
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Monitor scraping activity
          </p>
        </div>
        <div className="w-44">
          <Select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {fetchError && (
        <div
          className="mb-4 flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border text-sm"
          style={{
            background:   'var(--danger-subtle)',
            borderColor:  'var(--danger)',
            color:        'var(--danger-text)',
          }}
          role="alert"
        >
          <AlertTriangle size={16} className="shrink-0" />
          <span className="flex-1">
            Failed to load jobs: {fetchError.message}
          </span>
          <Button
            variant="ghost"
            size="xs"
            leftIcon={<RefreshCw size={12} />}
            onClick={() => mutate()}
            style={{ color: 'var(--danger-text)' }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-[var(--radius-lg)] overflow-hidden bg-glow-top"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['#','University','Status','Accuracy','Fields','Strategy','Attempts','Started','Duration']
                  .map(h => <th key={h} className={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(10)].map((_, i) => <TableRowSkeleton key={i} cols={9} />)
                : !data?.data.length
                  ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-sm"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {fetchError ? 'Could not load jobs.' : 'No scrape jobs found.'}
                      </td>
                    </tr>
                  )
                  : data.data.map((job: ScrapeJob) => {
                    const dur = job.startedAt && job.completedAt
                      ? Math.round(
                          (new Date(job.completedAt).getTime() -
                           new Date(job.startedAt).getTime()) / 1000
                        )
                      : null;

                    return (
                      <tr
                        key={job.id}
                        className="group hover:bg-[var(--bg-subtle)] transition-colors"
                      >
                        <td className={`${TD} font-mono text-xs`} style={{ color: 'var(--text-tertiary)' }}>
                          #{job.id}
                        </td>
                        <td className={TD}>
                          <Link
                            href={`/universities/${job.universityId}`}
                            className="font-medium transition-colors hover:underline"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {job.university?.name ?? `#${job.universityId}`}
                          </Link>
                          {job.retryOfJobId && (
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                              retry of #{job.retryOfJobId}
                            </p>
                          )}
                        </td>
                        <td className={TD}>
                          <Badge label={job.status} variant={statusToBadge(job.status)} />
                        </td>
                        <td className={TD}>
                          {job.accuracyScore != null ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-12 h-1.5 rounded-full overflow-hidden"
                                style={{ background: 'var(--bg-subtle)' }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${job.accuracyScore}%`,
                                    background: job.accuracyScore >= 75
                                      ? 'var(--success)'
                                      : job.accuracyScore >= 50
                                        ? 'var(--warning)'
                                        : 'var(--danger)',
                                  }}
                                />
                              </div>
                              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {Math.round(job.accuracyScore)}%
                              </span>
                            </div>
                          ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                        </td>
                        <td className={`${TD} text-xs`} style={{ color: 'var(--text-secondary)' }}>
                          {job.fieldsFound}/{job.fieldsTotal}
                        </td>
                        <td className={TD}>
                          {job.strategy ? (
                            <span
                              className="font-mono text-xs px-1.5 py-0.5 rounded"
                              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
                            >
                              {job.strategy}
                            </span>
                          ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                        </td>
                        <td className={`${TD} text-xs`} style={{ color: 'var(--text-secondary)' }}>
                          {job.attemptCount}/{job.maxAttempts}
                        </td>
                        <td className={`${TD} text-xs whitespace-nowrap`} style={{ color: 'var(--text-tertiary)' }}>
                          {job.startedAt
                            ? formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })
                            : '—'}
                        </td>
                        <td className={`${TD} text-xs`} style={{ color: 'var(--text-tertiary)' }}>
                          {dur != null ? `${dur}s` : '—'}
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.meta.pages ?? 1) > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {data?.meta.total} total jobs
            </p>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 h-7 text-xs rounded-[var(--radius-md)] border transition-colors disabled:opacity-40"
                style={{ borderColor: 'var(--border-md)', color: 'var(--text-secondary)' }}
              >
                Prev
              </button>
              <span
                className="px-3 h-7 flex items-center text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {page} / {data?.meta.pages}
              </span>
              <button
                disabled={page === data?.meta.pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 h-7 text-xs rounded-[var(--radius-md)] border transition-colors disabled:opacity-40"
                style={{ borderColor: 'var(--border-md)', color: 'var(--text-secondary)' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
