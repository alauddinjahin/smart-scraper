import { Skeleton, TableRowSkeleton } from '@/components/ui/Skeleton';

export default function JobsLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <Skeleton height={28} width="140px" />
          <Skeleton height={14} width="280px" />
        </div>
        <Skeleton height={36} width="144px" rounded="md" />
      </div>

      <div
        className="rounded-[var(--radius-lg)] overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
              {[40, 160, 90, 80, 60, 80, 70, 110, 70].map((w, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton height={11} width={w} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(12)].map((_, i) => (
              <TableRowSkeleton key={i} cols={9} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
