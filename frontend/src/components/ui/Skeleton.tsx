import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  height?:    string | number;
  width?:     string | number;
  rounded?:   'sm' | 'md' | 'lg' | 'full';
  lines?:     number;
}

const RADIUS = {
  sm:   'rounded-[var(--radius-sm)]',
  md:   'rounded-[var(--radius-md)]',
  lg:   'rounded-[var(--radius-lg)]',
  full: 'rounded-full',
};

export function Skeleton({ className, height, width, rounded = 'md', lines }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={className}
            height={height ?? 16}
            width={i === lines - 1 ? '60%' : width}
            rounded={rounded}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      className={clsx(
        'block animate-pulse bg-[var(--bg-subtle)]',
        RADIUS[rounded],
        className
      )}
      style={{
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        width:  width  ? (typeof width  === 'number' ? `${width}px`  : width)  : undefined,
      }}
      aria-hidden="true"
    />
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton height={16} width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-3">
      <Skeleton height={20} width="50%" />
      <Skeleton height={14} width="80%" />
      <Skeleton height={14} width="65%" />
    </div>
  );
}
