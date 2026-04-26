// ============================================
// ABC Express AIP — Standardized API Response
// ============================================

import type { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
  meta?: PaginationMeta,
): void => {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  if (meta) body.meta = meta;
  res.status(statusCode).json(body);
};

export const sendCreated = <T>(res: Response, data: T, message = 'Created successfully'): void => {
  sendSuccess(res, data, 201, message);
};

export const sendError = (res: Response, statusCode: number, error: string): void => {
  res.status(statusCode).json({ success: false, error });
};

export const sendNotFound = (res: Response, entity = 'Resource'): void => {
  sendError(res, 404, `${entity} not found`);
};

export const sendValidationError = (res: Response, error: string): void => {
  sendError(res, 400, error);
};

export const sendUnauthorized = (res: Response, message = 'Unauthorized'): void => {
  sendError(res, 401, message);
};

export const sendForbidden = (res: Response, message = 'Forbidden'): void => {
  sendError(res, 403, message);
};
