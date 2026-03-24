import type { Metadata } from 'next';
import UniversityTable from '@/components/university/UniversityTable';

export const metadata: Metadata = { title: 'Universities' };

export default function UniversitiesPage() {
  return (
    <div className="py-8 px-4 lg:px-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Universities</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage university records and trigger data scraping
        </p>
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] bg-glow-top overflow-hidden">
        <UniversityTable />
      </div>
    </div>
  );
}
