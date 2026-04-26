// ============================================
// ABC Express AIP — Pagination Helpers
// ============================================

import { config } from '../config.js';
import type { PaginationMeta } from './response.js';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const parsePagination = (query: Record<string, unknown>): PaginationParams => {
  const page = Math.max(1, parseInt(String(query.page ?? config.pagination.defaultPage), 10) || config.pagination.defaultPage);
  const limit = Math.min(
    config.pagination.maxLimit,
    Math.max(1, parseInt(String(query.limit ?? config.pagination.defaultLimit), 10) || config.pagination.defaultLimit),
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPaginationMeta = (page: number, limit: number, total: number): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

export interface SortParams {
  orderBy: Record<string, 'asc' | 'desc'>;
}

const ALLOWED_SORT_DIRS = ['asc', 'desc'] as const;

export const parseSort = (
  query: Record<string, unknown>,
  allowedFields: string[],
  defaultField = 'createdAt',
  defaultDir: 'asc' | 'desc' = 'desc',
): SortParams => {
  const sortBy = String(query.sortBy ?? defaultField);
  const sortDir = String(query.sortDir ?? defaultDir) as 'asc' | 'desc';
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  const dir = ALLOWED_SORT_DIRS.includes(sortDir) ? sortDir : defaultDir;
  return { orderBy: { [field]: dir } };
};
