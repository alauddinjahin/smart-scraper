'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Building2,
  Cpu,
  ChevronRight,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  children?: NavItem[];
}

const NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/universities', label: 'All Universities', icon: Building2 },
  { href: '/jobs', label: 'Scrape Jobs', icon: Cpu },
];


export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLElement>(null);
  const { user, logout, isLoading } = useAuth();
  const toast = useToast();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [overlaySubmenu, setOverlaySubmenu] = useState<string | null>(null);
  const [overlayTop, setOverlayTop] = useState<number>(0);

  useEffect(() => {
    if (!overlaySubmenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const overlay = document.getElementById('sidebar-overlay-submenu');
      if (!overlay) return;
      if (overlay.contains(event.target as Node)) return;

      setOverlaySubmenu(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [overlaySubmenu]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  // Toggle nested menu
  const toggleMenu = (href: string) => {
    const newSet = new Set(expandedMenus);
    if (newSet.has(href)) {
      newSet.delete(href);
    } else {
      newSet.add(href);
    }
    setExpandedMenus(newSet);
  };

  const handleParentMenuClick = (event: React.MouseEvent<HTMLButtonElement>, href: string) => {
    if (isCollapsed) {
      const rect = event.currentTarget.getBoundingClientRect();
      setOverlayTop(rect.top);
      setOverlaySubmenu((prev) => (prev === href ? null : href));
      return;
    }

    setOverlaySubmenu(null);
    toggleMenu(href);
  };

  // Animation on mount
  useEffect(() => {
    import('gsap').then(({ gsap }) => {
      if (!sidebarRef.current) return;
      const items = sidebarRef.current.querySelectorAll('.nav-item');
      gsap.fromTo(
        items,
        { opacity: 0, x: -12 },
        {
          opacity: 1,
          x: 0,
          duration: 0.3,
          stagger: 0.05,
          ease: 'power2.out',
          delay: 0.1,
        }
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

  const renderNavItem = (
    item: NavItem,
    isNested: boolean = false
  ) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.has(item.href);
    const isActive =
      item.href === '/'
        ? pathname === '/'
        : pathname.startsWith(item.href);

    return (
      <div key={item.href}>
        {hasChildren ? (
          // Parent menu item with children
          <button
            onClick={(e) => handleParentMenuClick(e, item.href)}
            className={clsx(
              'nav-item group w-full flex items-center rounded-[var(--radius-md)]',
              'transition-all duration-[var(--duration-fast)] text-left',
              isCollapsed ? 'justify-center px-2 py-2 opacity-70' : 'gap-3 px-3 py-2 text-sm cursor-pointer',
              isNested && !isCollapsed && 'ml-4 text-xs'
            )}
            style={{
              background: isActive ? 'var(--brand-subtle)' : 'transparent',
              color: isActive ? 'var(--brand-text)' : 'var(--text-secondary)',
              fontWeight: isActive ? '500' : '400',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'var(--bg-subtle)';
                (e.currentTarget as HTMLButtonElement).style.color =
                  'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'transparent';
                (e.currentTarget as HTMLButtonElement).style.color =
                  'var(--text-secondary)';
              }
            }}
            aria-label={`Toggle ${item.label}`}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon
              size={16}
              className="shrink-0"
              style={{
                color: isActive
                  ? 'var(--brand)'
                  : 'var(--text-tertiary)',
              }}
            />
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                <ChevronDown
                  size={12}
                  className={clsx(
                    'shrink-0 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                  style={{
                    color: isActive ? 'var(--brand)' : 'var(--text-tertiary)',
                    opacity: 0.6,
                  }}
                />
              </>
            )}
          </button>
        ) : (
          // Regular link item
          <Link
            href={item.href}
            className={clsx(
              'nav-item group flex items-center rounded-[var(--radius-md)]',
              'transition-all duration-[var(--duration-fast)]',
              isCollapsed ? 'justify-center px-2 py-2 opacity-70' : 'gap-3 px-3 py-2 text-sm cursor-pointer',
              isNested && !isCollapsed && 'ml-4 text-xs'
            )}
            style={{
              background: isActive ? 'var(--brand-subtle)' : 'transparent',
              color: isActive ? 'var(--brand-text)' : 'var(--text-secondary)',
              fontWeight: isActive ? '500' : '400',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  'var(--bg-subtle)';
                (e.currentTarget as HTMLAnchorElement).style.color =
                  'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  'transparent';
                (e.currentTarget as HTMLAnchorElement).style.color =
                  'var(--text-secondary)';
              }
            }}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon
              size={16}
              className="shrink-0"
              style={{
                color: isActive ? 'var(--brand)' : 'var(--text-tertiary)',
              }}
            />
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {/* {isActive && (
                  <ChevronRight
                    size={12}
                    style={{ color: 'var(--brand)', opacity: 0.6 }}
                  />
                )} */}
              </>
            )}
          </Link>
        )}

        {/* Nested children */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="space-y-0.5">
            {item.children!.map((child) => renderNavItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
          
        onClick={() => {
          setIsMobileOpen(!isMobileOpen) 
        }}
        className="lg:hidden fixed top-4 left-[1.2rem] z-50 p-2 rounded-[var(--radius-md)] transition-colors"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={clsx(
          'flex flex-col h-screen overflow-y-auto',
          'transition-all duration-300 ease-in-out',
          'fixed lg:sticky lg:top-0 z-40 lg:z-auto',
          'border-r top-0 left-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'shrink-0'
        )}
        style={{
          width: isCollapsed ? 'var(--sidebar-w-collapsed, 80px)' : 'var(--sidebar-w)',
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header with toggle */}
        <div
          className={clsx(
            'flex items-center border-b',
            isCollapsed ? 'justify-center px-2 py-4' : 'justify-between px-4 py-5'
          )}
          style={{ borderColor: 'var(--border)' }}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 flex-1">
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
          )}
          {isCollapsed && (
            <div
              className="w-7 h-7 rounded-[var(--radius-md)] md:flex hidden items-center justify-center shrink-0"
              style={{ background: 'var(--brand)' }}
            >
              <Building2 size={14} color="white" strokeWidth={2} />
            </div>
          )}

          {/* Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex items-center justify-center p-1 rounded-[var(--radius-md)] transition-colors ml-2"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'var(--bg-subtle)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'transparent';
              }}
              aria-label="Collapse sidebar"
            >
              <ChevronRight
                size={16}
                className="transition-transform duration-300"
              />
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex items-center justify-center p-1 rounded-[var(--radius-md)] transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'var(--bg-subtle)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'transparent';
              }}
              aria-label="Expand sidebar"
            >
              <ChevronRight
                size={16}
                className="transition-transform duration-300 rotate-180"
              />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={clsx('flex-1 py-4 space-y-0.5', isCollapsed ? 'px-2' : 'px-3')}>
          {NAV.map((item) => renderNavItem(item))}
        </nav>

        {/* User + Logout */}
        <div
          className={clsx('border-t space-y-2', isCollapsed ? 'px-2 py-3' : 'px-3 py-3')}
          style={{ borderColor: 'var(--border)' }}
        >
          {/* User info */}
          {!isLoading && user && !isCollapsed && (
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)]"
              style={{ background: 'var(--bg-subtle)' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                style={{
                  background: 'var(--brand-subtle)',
                  color: 'var(--brand-text)',
                }}
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

          {/* Collapsed user avatar */}
          {!isLoading && user && isCollapsed && (
            <div
              className="flex items-center justify-center px-2 py-2 rounded-[var(--radius-md)]"
              style={{ background: 'var(--bg-subtle)' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
                style={{
                  background: 'var(--brand-subtle)',
                  color: 'var(--brand-text)',
                }}
                title={user.name}
              >
                {user.avatarInitials}
              </div>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={clsx(
              'w-full flex items-center rounded-[var(--radius-md)] transition-colors duration-150',
              isCollapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-3 py-2 text-sm'
            )}
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'var(--danger-subtle)';
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--danger-text)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'transparent';
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--text-secondary)';
            }}
            aria-label="Sign out"
            title={isCollapsed ? 'Sign out' : undefined}
          >
            <LogOut size={15} className="shrink-0" />
            {!isCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Floating collapsed submenu overlay */}
      {isCollapsed && overlaySubmenu && (
        <div
          id="sidebar-overlay-submenu"
          className="fixed left-[var(--sidebar-w-collapsed,80px)] w-52 bg-white border rounded-lg shadow-lg z-50"
          style={{
            borderColor: 'var(--border)',
            top: overlayTop,
            transform: 'translateY(-8px)',
          }}
        >
          <div className="py-2">
            {NAV.find((item) => item.href === overlaySubmenu)?.children?.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                onClick={() => setOverlaySubmenu(null)}
              >
                <child.icon size={14} />
                <span>{child.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
