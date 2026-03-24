'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import { Badge, typeToBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import UniversityModal from './UniversityModal';
import { ScrapeOneButton } from './ScrapeButton';
import { useUniversities, useDeleteUniversity, useUniversity } from '@/lib/hooks/useUniversities';
import type { UniversityListItem, UniversityType, UniversityDetail } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';

export default function UniversityTable() {
  const [page,   setPage]    = useState(1);
  const [search, setSearch]  = useState('');
  const [type,   setType]    = useState<UniversityType | ''>('');
  const [modal,  setModal]   = useState(false);
  const [editing, setEditing] = useState<UniversityDetail | null>(null);
  const [editId,  setEditId]  = useState<number | null>(null);
  const toast                 = useToast();
  const tableRef              = useRef<HTMLDivElement>(null);

  const { data, isLoading, error: fetchError, mutate } = useUniversities({
    page,
    limit:  15,
    search: search || undefined,
    type:   (type as UniversityType) || undefined,
  });

  // Load detail for editing
  const { data: editData } = useUniversity(editId);
  useEffect(() => {
    if (editData?.data) setEditing(editData.data);
  }, [editData]);

  const deleteMutation = useDeleteUniversity();

  // GSAP row entrance
  useEffect(() => {
    if (!tableRef.current || isLoading) return;
    import('gsap').then(({ gsap }) => {
      const rows = tableRef.current!.querySelectorAll('tbody tr');
      gsap.fromTo(rows,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.03, ease: 'power2.out' }
      );
    });
  }, [data, isLoading]);

  const handleDelete = useCallback(async (u: UniversityListItem) => {
    if (!confirm(`Delete "${u.name}" and all its scraped data? This cannot be undone.`)) return;
    try {
      await deleteMutation.trigger(u.id);
      toast.success(`Deleted "${u.name}"`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  }, [deleteMutation, toast]);

  const openEdit = (u: UniversityListItem) => {
    setEditId(u.id);
    setModal(true);
  };

  const handleModalClose = () => {
    setModal(false);
    setEditing(null);
    setEditId(null);
    mutate();
  };

  const pages  = data?.meta.pages ?? 1;
  const total  = data?.meta.total ?? 0;


  const TH = 'text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider whitespace-nowrap bg-[var(--bg-subtle)] border-b border-[var(--border)]';
  const TD = 'px-4 py-3 text-sm border-b border-[var(--border)]';

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[var(--border)]">
        <div className="flex-1 min-w-[200px]">
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or location…"
            leftIcon={<Search size={15} />}
          />
        </div>
        <div className="w-36">
          <Select
            value={type}
            onChange={e => { setType(e.target.value as UniversityType | ''); setPage(1); }}
          >
            <option value="">All types</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </Select>
        </div>
        {(search || type) && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Filter size={13} />}
            onClick={() => { setSearch(''); setType(''); setPage(1); }}
          >
            Clear
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => { setEditing(null); setEditId(null); setModal(true); }}
        >
          Add university
        </Button>
      </div>

      {fetchError && (
        <div
          className="mx-4 my-3 flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border text-sm"
          style={{
            background:  'var(--danger-subtle)',
            borderColor: 'var(--danger)',
            color:       'var(--danger-text)',
          }}
          role="alert"
        >
          <AlertTriangle size={15} className="shrink-0" />
          <span className="flex-1">
            Failed to load: {fetchError.message ?? 'Network error'}
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
      <div ref={tableRef} className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={TH}>University</th>
              <th className={TH}>Location</th>
              <th className={TH}>Type</th>
              <th className={TH}>Fees</th>
              <th className={TH}>Scholarships</th>
              <th className={TH}>Deadline</th>
              <th className={TH}>Last scraped</th>
              <th className={TH} style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(8)].map((_, i) => <TableRowSkeleton key={i} cols={8} />)
              : !data?.data.length
                ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-sm text-[var(--text-tertiary)]">
                      {search || type ? 'No universities match your filters.' : 'No universities yet. Add one to get started.'}
                    </td>
                  </tr>
                )
                : data.data.map(u => (
                  <tr
                    key={u.id}
                    className="group hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    <td className={TD}>
                      <Link
                        href={`/universities/${u.id}`}
                        className="font-medium text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors"
                      >
                        {u.name}
                      </Link>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate max-w-[200px]">
                        {u.website.replace(/^https?:\/\//, '')}
                      </p>
                    </td>
                    <td className={`${TD} text-[var(--text-secondary)]`}>{u.location ?? '—'}</td>
                    <td className={TD}>
                      <Badge label={u.type} variant={typeToBadge(u.type)} />
                    </td>
                    <td className={`${TD} text-[var(--text-secondary)]`}>
                      {u.tuitionCount} {u.tuitionCount === 1 ? 'program' : 'programs'}
                    </td>
                    <td className={`${TD} text-[var(--text-secondary)]`}>{u.scholarshipCount}</td>
                    <td className={`${TD} text-[var(--text-secondary)] text-xs`}>
                      {u.admissionDeadline ?? '—'}
                    </td>
                    <td className={`${TD} text-[var(--text-tertiary)] text-xs`}>
                      {u.lastScrapedAt
                        ? formatDistanceToNow(new Date(u.lastScrapedAt), { addSuffix: true })
                        : '—'}
                    </td>
                    <td className={TD}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ScrapeOneButton universityId={u.id} size="xs" />
                        <Button
                          variant="ghost"
                          size="xs"
                          leftIcon={<Pencil size={12} />}
                          onClick={() => openEdit(u)}
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          leftIcon={<Trash2 size={12} />}
                          onClick={() => handleDelete(u)}
                          className="hover:text-[var(--danger-text)]"
                        />
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-tertiary)]">
            {total} {total === 1 ? 'university' : 'universities'}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              leftIcon={<ChevronLeft size={13} />}
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            />
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
              const p = pages <= 5 ? i + 1
                : page <= 3       ? i + 1
                : page >= pages - 2 ? pages - 4 + i
                : page - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`
                    w-7 h-7 text-xs rounded-[var(--radius-md)] transition-colors
                    ${p === page
                      ? 'bg-[var(--brand)] text-white font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'}
                  `}
                >
                  {p}
                </button>
              );
            })}
            <Button
              variant="ghost"
              size="xs"
              leftIcon={<ChevronRight size={13} />}
              disabled={page === pages}
              onClick={() => setPage(p => p + 1)}
            />
          </div>
        </div>
      )}

      {/* Modal */}
      <UniversityModal
        open={modal}
        onClose={handleModalClose}
        initial={editing}
      />
    </>
  );
}
