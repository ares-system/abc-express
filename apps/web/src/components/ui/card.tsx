'use client';

import { cn } from '@/lib/utils';

// ─── Card ───────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export const Card = ({ children, className, padding = 'md' }: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-surface-200 bg-white shadow-sm',
        paddings[padding],
        className,
      )}
    >
      {children}
    </div>
  );
};

// ─── Card Header ────────────────────────────────────────────

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader = ({ title, subtitle, action, className }: CardHeaderProps) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h3 className="text-base font-semibold text-surface-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-surface-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// ─── KPI Card ───────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export const KpiCard = ({ title, value, subtitle, icon, trend, className }: KpiCardProps) => {
  const trendPositive = trend && trend.value >= 0;

  return (
    <div className={cn('kpi-card', className)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-surface-500">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-surface-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-surface-400">{subtitle}</p>}
          {trend && (
            <p
              className={cn(
                'mt-2 inline-flex items-center text-xs font-medium',
                trendPositive ? 'text-green-600' : 'text-red-600',
              )}
            >
              <span aria-hidden="true">{trendPositive ? '\u2191' : '\u2193'}</span>
              <span className="ml-0.5">
                {Math.abs(trend.value)}% {trend.label}
              </span>
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 rounded-lg bg-brand-50 p-2.5 text-brand-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
