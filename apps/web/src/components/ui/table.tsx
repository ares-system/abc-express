'use client';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

// ─── Sort Icon ──────────────────────────────────────────────

const SortIcon = ({ active, dir }: { active: boolean; dir?: 'asc' | 'desc' }) => {
  if (!active) return <ChevronsUpDown className="h-3.5 w-3.5 text-surface-300" />;
  if (dir === 'asc') return <ChevronUp className="h-3.5 w-3.5 text-brand-600" />;
  return <ChevronDown className="h-3.5 w-3.5 text-brand-600" />;
};

// ─── Skeleton rows ──────────────────────────────────────────

const SkeletonRows = ({ cols, rows = 5 }: { cols: number; rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} className="px-4 py-3">
            <div className="skeleton h-4 w-3/4" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ─── Component ──────────────────────────────────────────────

export const DataTable = <T,>({
  columns,
  data,
  keyExtractor,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  emptyMessage = 'No data found.',
  isLoading = false,
  className,
}: DataTableProps<T>) => {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  col.sortable && 'cursor-pointer select-none hover:text-surface-700',
                  col.className,
                )}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                aria-sort={
                  sortKey === col.key
                    ? sortDir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && <SortIcon active={sortKey === col.key} dir={sortKey === col.key ? sortDir : undefined} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <SkeletonRows cols={columns.length} />
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-surface-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyExtractor(row)}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={col.className}>
                    {col.render(row, idx)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ─── Pagination ─────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ page, totalPages, total, limit, onPageChange }: PaginationProps) => {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-surface-200 px-4 py-3 text-sm">
      <p className="text-surface-500">
        Showing <span className="font-medium text-surface-700">{from}</span> to{' '}
        <span className="font-medium text-surface-700">{to}</span> of{' '}
        <span className="font-medium text-surface-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          className="rounded-md px-3 py-1.5 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:pointer-events-none"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }
          return (
            <button
              key={pageNum}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium',
                page === pageNum
                  ? 'bg-brand-600 text-white'
                  : 'text-surface-600 hover:bg-surface-100',
              )}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          className="rounded-md px-3 py-1.5 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:pointer-events-none"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};
