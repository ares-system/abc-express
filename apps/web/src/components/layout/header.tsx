'use client';

import { useAuth } from '@/lib/auth-context';
import { Bell, Search, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '@/lib/hooks';
import { cn } from '@/lib/utils';

// ─── Props ──────────────────────────────────────────────────

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────────

export const Header = ({ title, subtitle, actions }: HeaderProps) => {
  const { user } = useAuth();
  const { connected } = useSocket();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-200 bg-white/80 px-6 backdrop-blur-sm">
      {/* Left — title */}
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-surface-900">{title}</h1>
        {subtitle && <p className="truncate text-sm text-surface-500">{subtitle}</p>}
      </div>

      {/* Right — actions + status */}
      <div className="flex items-center gap-3">
        {actions}

        {/* Connection indicator */}
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium',
            connected
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700',
          )}
          title={connected ? 'Real-time connected' : 'Real-time disconnected'}
        >
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {connected ? 'Live' : 'Offline'}
        </div>

        {/* Notifications (placeholder) */}
        <button
          className="relative rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-500" aria-hidden="true" />
        </button>

        {/* User avatar */}
        {user && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
            title={user.name}
            aria-label={`Signed in as ${user.name}`}
          >
            {user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
};
