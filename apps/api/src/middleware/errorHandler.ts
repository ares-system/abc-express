// ============================================
// ABC Express AIP — Global Error Handler
// ============================================

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { sendError, sendValidationError } from '../utils/response.js';

/**
 * Catch-all error handler.
 * Normalizes Zod validation errors, Prisma errors, and generic errors.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // --- Zod validation errors ---
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    sendValidationError(res, messages);
    return;
  }

  // --- Prisma known request errors ---
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') ?? 'field';
        sendError(res, 409, `Duplicate value for: ${target}`);
        return;
      }
      case 'P2025': {
        sendError(res, 404, 'Record not found');
        return;
      }
      case 'P2003': {
        sendError(res, 400, 'Related record not found (foreign key constraint)');
        return;
      }
      default: {
        logger.error(`Prisma error ${err.code}: ${err.message}`);
        sendError(res, 500, 'Database error');
        return;
      }
    }
  }

  // --- Prisma validation errors ---
  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error(`Prisma validation error: ${err.message}`);
    sendError(res, 400, 'Invalid data provided');
    return;
  }

  // --- Generic errors ---
  logger.error(err);
  sendError(
    res,
    (err as any).statusCode ?? 500,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  );
};

/**
 * 404 catch-all for unmatched routes.
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  sendError(res, 404, 'Route not found');
};
