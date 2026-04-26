'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Package,
  Truck,
  Building2,
  Users,
  FileText,
  DollarSign,
  Route,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Box,
} from 'lucide-react';
import { useState } from 'react';

// ─── Navigation items ───────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: string;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Shipments', href: '/shipments', icon: <Package className="h-5 w-5" /> },
      { label: 'Vehicles', href: '/vehicles', icon: <Truck className="h-5 w-5" /> },
      { label: 'Routes', href: '/routes', icon: <Route className="h-5 w-5" /> },
      { label: 'Branches', href: '/branches', icon: <Building2 className="h-5 w-5" /> },
      { label: 'Clients', href: '/clients', icon: <Users className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Invoices', href: '/invoices', icon: <FileText className="h-5 w-5" />, roles: ['ADMIN', 'FINANCE_MANAGER', 'OPS_MANAGER'] },
      { label: 'Costs', href: '/costs', icon: <DollarSign className="h-5 w-5" />, roles: ['ADMIN', 'FINANCE_MANAGER', 'OPS_MANAGER'] },
    ],
  },
  {
    title: 'AI Platform',
    items: [
      { label: 'AI Decisions', href: '/decisions', icon: <Brain className="h-5 w-5" />, badge: 'AIP' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" />, roles: ['ADMIN'] },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout, canAccess } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => setCollapsed((c) => !c);
  const handleLogout = () => logout();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-surface-200 bg-white transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-surface-200 px-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Box className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-surface-900">ABC Express</p>
            <p className="truncate text-2xs text-surface-400">AI Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || canAccess(item.roles as any),
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <p className="mb-2 px-3 text-2xs font-semibold uppercase tracking-wider text-surface-400">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1" role="list">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'sidebar-link',
                          isActive && 'sidebar-link--active',
                          collapsed && 'justify-center px-0',
                        )}
                        title={collapsed ? item.label : undefined}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {item.icon}
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <span className="rounded bg-brand-100 px-1.5 py-0.5 text-2xs font-semibold text-brand-700">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer — user + collapse */}
      <div className="border-t border-surface-200 px-3 py-3">
        {!collapsed && user && (
          <div className="mb-3 rounded-lg bg-surface-50 px-3 py-2.5">
            <p className="truncate text-sm font-medium text-surface-800">{user.name}</p>
            <p className="truncate text-2xs text-surface-400">{user.role.replace('_', ' ')}</p>
          </div>
        )}
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-2' : 'justify-between')}>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleToggle}
            className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
