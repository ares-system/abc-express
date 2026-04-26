'use client';

import { cn, type StatusVariant, variantClasses, variantDotClasses } from '@/lib/utils';

// ─── Props ──────────────────────────────────────────────────

interface BadgeProps {
  variant?: StatusVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────

export const Badge = ({ variant = 'neutral', children, dot = false, className }: BadgeProps) => {
  return (
    <span
      className={cn(
        'badge border',
        variantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('mr-1.5 inline-block h-1.5 w-1.5 rounded-full', variantDotClasses[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
