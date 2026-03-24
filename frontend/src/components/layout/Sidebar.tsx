'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { LayoutDashboard, Building2, Cpu, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

const NAV = [
  { href: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/universities', label: 'Universities', icon: Building2       },
  { href: '/jobs',         label: 'Scrape Jobs',  icon: Cpu             },
];

export default function Sidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const sidebarRef  = useRef<HTMLElement>(null);
  const { user, logout, isLoading } = useAuth();
  const toast       = useToast();

  useEffect(() => {
    import('gsap').then(({ gsap }) => {
      if (!sidebarRef.current) return;
      const items = sidebarRef.current.querySelectorAll('.nav-item');
      gsap.fromTo(
        items,
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out', delay: 0.1 }
      );
    });
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className="shrink-0 flex flex-col h-screen sticky top-0 border-r overflow-y-auto"
      style={{
        width:       'var(--sidebar-w)',
        background:  'var(--bg-surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
            style={{ background: 'var(--brand)' }}
          >
            <Building2 size={14} color="white" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-semibold leading-none truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              Smart Scraper
            </p>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: 'var(--text-tertiary)' }}
            >
              BD Universities
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/'
            ? pathname === '/'
            : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'nav-item group flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)]',
                'text-sm transition-all duration-[var(--duration-fast)]'
              )}
              style={{
                background: active ? 'var(--brand-subtle)' : 'transparent',
                color:      active ? 'var(--brand-text)'   : 'var(--text-secondary)',
                fontWeight: active ? '500'                  : '400',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-subtle)';
                  (e.currentTarget as HTMLAnchorElement).style.color      = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color      = 'var(--text-secondary)';
                }
              }}
            >
              <Icon
                size={16}
                className="shrink-0"
                style={{ color: active ? 'var(--brand)' : 'var(--text-tertiary)' }}
              />
              <span className="flex-1">{label}</span>
              {active && (
                <ChevronRight size={12} style={{ color: 'var(--brand)', opacity: 0.6 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div
        className="px-3 py-3 border-t space-y-2"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* User info */}
        {!isLoading && user && (
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)]"
            style={{ background: 'var(--bg-subtle)' }}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
              style={{ background: 'var(--brand-subtle)', color: 'var(--brand-text)' }}
              aria-hidden="true"
            >
              {user.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-medium truncate leading-none"
                style={{ color: 'var(--text-primary)' }}
              >
                {user.name}
              </p>
              <p
                className="text-[10px] mt-0.5 truncate capitalize"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {user.role}
              </p>
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors duration-150"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--danger-subtle)';
            (e.currentTarget as HTMLButtonElement).style.color      = 'var(--danger-text)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color      = 'var(--text-secondary)';
          }}
          aria-label="Sign out"
        >
          <LogOut size={15} className="shrink-0" />
          <span>Sign out</span>
        </button>

      </div>
    </aside>
  );
}
