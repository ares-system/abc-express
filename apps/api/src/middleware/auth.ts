// ============================================
// ABC Express AIP — JWT Auth Middleware
// ============================================

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { sendUnauthorized, sendForbidden } from '../utils/response.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  branchId: string | null;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifies JWT token from Authorization header.
 * Sets req.user on success.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendUnauthorized(res, 'Missing or invalid Authorization header');
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, 'Token expired');
      return;
    }
    sendUnauthorized(res, 'Invalid token');
  }
};

/**
 * Role-based authorization gate.
 * Pass allowed roles; returns 403 if user role not in list.
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendForbidden(res, `Role '${req.user.role}' does not have access to this resource`);
      return;
    }

    next();
  };
};

/**
 * Optional auth — attaches user if token present, but doesn't block.
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = decoded;
    } catch {
      // Ignore invalid tokens in optional auth
    }
  }

  next();
};

/**
 * Generate JWT token for a user.
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
};

/**
 * Generate refresh token (longer-lived).
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });
};
