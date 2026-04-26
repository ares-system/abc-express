// ============================================
// ABC Express AIP — Auth Routes
// ============================================

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@abc/db';
import { JwtEs256Service } from '../../packages/security/src/jwt-es256.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate, generateToken, generateRefreshToken } from '../middleware/auth.js';
import { loginSchema, refreshTokenSchema } from '../schemas.js';
import { sendSuccess, sendUnauthorized, sendError } from '../utils/response.js';

const router = Router();

let jwtServiceInstance: JwtEs256Service | null = null;

export function setJwtService(service: JwtEs256Service) {
  jwtServiceInstance = service;
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { branch: { select: { id: true, code: true, name: true } } },
    });

    if (!user) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    sendSuccess(res, {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        branch: user.branch,
      },
    }, 200, 'Login successful');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token - supports both ES256 (new) and HS256 (legacy)
 */
router.post('/refresh', validateBody(refreshTokenSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Try ES256 first if jwtService is available
    if (jwtServiceInstance) {
      try {
        const verified = await jwtServiceInstance.verifyRefreshToken(refreshToken);
        const user = await prisma.user.findUnique({
          where: { id: verified.userId },
          select: { id: true, email: true, role: true, branchId: true },
        });
        if (!user) {
          sendUnauthorized(res, 'User not found');
          return;
        }
        const tokens = await jwtServiceInstance.signTokenPair({
          userId: user.id,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
        });
        sendSuccess(res, tokens, 200, 'Token refreshed (ES256)');
        return;
      } catch {
        // Fall through to legacy HS256
      }
    }

    // Legacy HS256 refresh
    const jwt = await import('jsonwebtoken');
    const config = (await import('../config.js')).config;
    const decoded = jwt.default.verify(refreshToken, config.jwt.secret) as any;
    const payload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      branchId: decoded.branchId,
    };
    const newToken = generateToken(payload);
    sendSuccess(res, { accessToken: newToken }, 200, 'Token refreshed (HS256 legacy)');
  } catch {
    sendUnauthorized(res, 'Invalid refresh token');
  }
});

/**
 * GET /api/auth/me
 * Return current user info
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        branch: { select: { id: true, code: true, name: true, city: true } },
        createdAt: true,
      },
    });

    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/auth/password
 * Change password for current user
 */
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      sendError(res, 400, 'New password must be at least 6 characters');
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      sendUnauthorized(res);
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      sendError(res, 400, 'Current password is incorrect');
      return;
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    });

    sendSuccess(res, null, 200, 'Password updated');
  } catch (err) {
    next(err);
  }
});

export default router;
