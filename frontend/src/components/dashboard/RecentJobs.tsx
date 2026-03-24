import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Badge, statusToBadge } from '@/components/ui/Badge';
import type { ScrapeJob } from '@/types/api';

interface RecentJobsProps {
  jobs: ScrapeJob[];
}

export default function RecentJobs({ jobs }: RecentJobsProps) {
  if (!jobs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-[var(--text-tertiary)]">No scrape jobs yet.</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Go to Universities and click Scrape to start.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-glow overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {['University', 'Status', 'Accuracy', 'Strategy', 'Started'].map(h => (
              <th
                key={h}
                className="text-left px-4 py-2.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr
              key={job.id}
              className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/universities/${job.universityId}`}
                  className="font-medium text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors"
                >
                  {job.university?.name ?? `University #${job.universityId}`}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Badge
                  label={job.status}
                  variant={statusToBadge(job.status)}
                />
              </td>
              <td className="px-4 py-3">
                {job.accuracyScore != null ? (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width:      `${job.accuracyScore}%`,
                          background: job.accuracyScore >= 75
                            ? 'var(--success)'
                            : job.accuracyScore >= 50
                              ? 'var(--warning)'
                              : 'var(--danger)',
                        }}
                      />
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {Math.round(job.accuracyScore)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-tertiary)]">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-[var(--text-tertiary)] bg-[var(--bg-subtle)] px-1.5 py-0.5 rounded">
                  {job.strategy ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                {job.startedAt
                  ? formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
