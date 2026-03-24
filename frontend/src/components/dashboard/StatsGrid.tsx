'use client';

import { useEffect, useRef } from 'react';
import { Building2, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '@/types/api';

interface StatCardProps {
  label:    string;
  value:    number | string;
  sub?:     string;
  icon:     React.ReactNode;
  accent?:  boolean;
  index:    number;
}

function StatCard({ label, value, sub, icon, accent, index }: StatCardProps) {
  const valRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof value !== 'number') return;
    import('gsap').then(({ gsap }) => {
      const obj = { val: 0 };
      gsap.to(obj, {
        val:      value,
        duration: 0.8,
        delay:    index * 0.08,
        ease:     'power2.out',
        onUpdate: () => {
          if (valRef.current) valRef.current.textContent = String(Math.round(obj.val));
        },
      });
    });
  }, [value, index]);

  return (
    <div
      className="stat-card bg-glow rounded-[var(--radius-lg)] p-5 flex flex-col gap-3"
      style={{
        background:  accent ? 'var(--brand)' : 'var(--bg-surface)',
        border:      accent ? 'none'          : '1px solid var(--border)',
        opacity: 0,
      }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: accent ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)' }}
        >
          {label}
        </p>
        <span
          className="p-1.5 rounded-[var(--radius-md)]"
          style={{
            background: accent ? 'rgba(255,255,255,0.15)' : 'var(--bg-subtle)',
            color:      accent ? '#fff'                    : 'var(--text-tertiary)',
          }}
        >
          {icon}
        </span>
      </div>
      <div>
        <p
          className="text-3xl font-semibold leading-none"
          style={{ color: accent ? '#fff' : 'var(--text-primary)' }}
        >
          {typeof value === 'number'
            ? <span ref={valRef}>0</span>
            : value
          }
        </p>
        {sub && (
          <p
            className="text-xs mt-1.5"
            style={{ color: accent ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)' }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

interface StatsGridProps {
  stats: DashboardStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const publicCount  = stats.byType?.find(b => b.type === 'PUBLIC')?._count._all  ?? 0;
  const privateCount = stats.byType?.find(b => b.type === 'PRIVATE')?._count._all ?? 0;
  const avgAcc       = stats.avgAccuracy ? `${Math.round(stats.avgAccuracy)}%` : '—';

  const cards = [
    { label: 'Total Universities', value: stats.total,   sub: 'In database',           icon: <Building2   size={15} />, accent: true  },
    { label: 'Public',             value: publicCount,   sub: 'Government institutions',icon: <BookOpen    size={15} />, accent: false },
    { label: 'Private',            value: privateCount,  sub: 'Private institutions',   icon: <GraduationCap size={15} />, accent: false },
    { label: 'Avg Accuracy',       value: avgAcc,        sub: 'Scrape completeness',    icon: <TrendingUp  size={15} />, accent: false },
  ];

  useEffect(() => {
    if (!gridRef.current) return;
    import('gsap').then(({ gsap }) => {
      gsap.to(gridRef.current!.querySelectorAll('.stat-card'), {
        opacity:   1,
        y:         0,
        duration:  0.4,
        stagger:   0.08,
        ease:      'power2.out',
        from:      { opacity: 0, y: 16 },
      });
    });
  }, []);

  return (
    <div
      ref={gridRef}
      className="grid gap-4"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
    >
      {cards.map((c, i) => (
        <StatCard key={c.label} {...c} index={i} />
      ))}
    </div>
  );
}
