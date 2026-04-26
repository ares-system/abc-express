'use client';

import { createElement, isValidElement, type ElementType, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Spinner ────────────────────────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export const Spinner = ({ size = 'md', className }: SpinnerProps) => (
  <svg
    className={cn('animate-spin text-brand-600', spinnerSizes[size], className)}
    viewBox="0 0 24 24"
    fill="none"
    aria-label="Loading"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ─── Page Loading ───────────────────────────────────────────

export const PageLoading = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
    <Spinner size="lg" />
    <p className="text-sm text-surface-500">{message}</p>
  </div>
);

// ─── Empty State ────────────────────────────────────────────

interface EmptyStateProps {
  /** Lucide icon component or any React node */
  icon?: ReactNode | LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

const renderEmptyIcon = (icon: ReactNode | LucideIcon | undefined) => {
  if (icon == null) return null;
  if (isValidElement(icon)) return icon;
  return createElement(icon as ElementType, { className: 'h-12 w-12' });
};

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 py-12 text-center">
    {icon != null && <div className="text-surface-300">{renderEmptyIcon(icon)}</div>}
    <h3 className="text-base font-semibold text-surface-700">{title}</h3>
    {description && <p className="max-w-sm text-sm text-surface-400">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// ─── Error State ────────────────────────────────────────────

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 py-12 text-center">
    <div className="rounded-full bg-red-50 p-3">
      <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <p className="text-sm text-surface-600">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        Try again
      </button>
    )}
  </div>
);

// ─── Skeleton ───────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn('skeleton', className)} />
);
