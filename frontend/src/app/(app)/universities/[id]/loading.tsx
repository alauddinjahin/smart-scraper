import { Skeleton } from '@/components/ui/Skeleton';

export default function UniversityDetailLoading() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Skeleton height={12} width="160px" className="mb-6" />
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2">
          <Skeleton height={32} width="320px" />
          <Skeleton height={16} width="220px" />
        </div>
        <div className="flex gap-2">
          <Skeleton height={36} width={80} rounded="md" />
          <Skeleton height={36} width={64} rounded="md" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5 space-y-3">
            <Skeleton height={18} width="140px" />
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex gap-4 py-2">
                <Skeleton height={14} width="100px" />
                <Skeleton height={14} width="60%" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5 space-y-3">
        <Skeleton height={18} width="100px" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 py-2 border-b border-[var(--border)]">
            <Skeleton height={14} width="40%" />
            <Skeleton height={14} width="15%" />
            <Skeleton height={14} width="10%" />
          </div>
        ))}
      </div>
    </div>
  );
}
