import { Skeleton, TableRowSkeleton } from '@/components/ui/Skeleton';

export default function UniversitiesLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-6 space-y-2">
        <Skeleton height={28} width="160px" />
        <Skeleton height={16} width="280px" />
      </div>

      {/* Table card skeleton */}
      <div
        className="rounded-[var(--radius-lg)] overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        {/* Toolbar skeleton */}
        <div
          className="flex items-center gap-3 p-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <Skeleton height={36} width="260px" rounded="md" />
          <Skeleton height={36} width="144px" rounded="md" />
          <div className="ml-auto">
            <Skeleton height={36} width="140px" rounded="md" />
          </div>
        </div>

        {/* Table skeleton */}
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
              {[180, 90, 70, 70, 90, 120, 110, 120].map((w, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton height={11} width={w} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <TableRowSkeleton key={i} cols={8} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
