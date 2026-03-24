import { Skeleton, CardSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <Skeleton height={28} width="180px" className="mb-2" />
        <Skeleton height={16} width="320px" />
      </div>
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-6">
        <Skeleton height={20} width="160px" className="mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-[var(--border)]">
            <Skeleton height={14} width="30%" />
            <Skeleton height={14} width="15%" />
            <Skeleton height={14} width="20%" />
          </div>
        ))}
      </div>
    </div>
  );
}
