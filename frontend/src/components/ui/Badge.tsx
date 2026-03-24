import type { ScrapeStatus, UniversityType } from '@/types/api';
import { clsx } from 'clsx';

type BadgeVariant =
  | 'public' | 'private'
  | 'completed' | 'failed' | 'running'
  | 'pending' | 'retrying' | 'skipped'
  | 'default';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  public:    'bg-[var(--brand-subtle)]    text-[var(--brand-text)]',
  private:   'bg-[var(--bg-subtle)]       text-[var(--text-secondary)]',
  completed: 'bg-[var(--success-subtle)]  text-[var(--success-text)]',
  failed:    'bg-[var(--danger-subtle)]   text-[var(--danger-text)]',
  running:   'bg-[var(--amber-subtle)]    text-[var(--amber-text)]',
  retrying:  'bg-[var(--warning-subtle)]  text-[var(--warning-text)]',
  pending:   'bg-[var(--bg-subtle)]       text-[var(--text-tertiary)]',
  skipped:   'bg-[var(--bg-subtle)]       text-[var(--text-tertiary)]',
  default:   'bg-[var(--bg-subtle)]       text-[var(--text-secondary)]',
};

const PULSE_VARIANTS: BadgeVariant[] = ['running', 'retrying', 'pending'];

interface BadgeProps {
  label:     string;
  variant?:  BadgeVariant;
  size?:     'sm' | 'md';
  className?: string;
}

export function Badge({ label, variant = 'default', size = 'sm', className }: BadgeProps) {
  const isActive = PULSE_VARIANTS.includes(variant);

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium tracking-wide uppercase',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        VARIANT_STYLES[variant],
        className
      )}
    >
      {isActive && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {label}
    </span>
  );
}

// Convenience mappers
export function statusToBadge(status: ScrapeStatus) {
  const map: Record<ScrapeStatus, BadgeVariant> = {
    COMPLETED: 'completed',
    FAILED:    'failed',
    RUNNING:   'running',
    RETRYING:  'retrying',
    PENDING:   'pending',
    SKIPPED:   'skipped',
  };
  return map[status] ?? 'default';
}

export function typeToBadge(type: UniversityType): BadgeVariant {
  return type === 'PUBLIC' ? 'public' : 'private';
}
