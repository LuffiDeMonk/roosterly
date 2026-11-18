import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      organizationId?: string;
      teamId?: string;
    }
  }
}

const getJwtSecret = (): string =>
  process.env.JWT_SECRET || 'roosterly-dev-jwt-secret-key-default-2026';

export const generateToken = (user: {
  _id: any;
  email: string;
  name: string;
  roles: string[];
}): string => {
  return jwt.sign(
    {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      roles: user.roles,
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};

export const extractToken = (req: Request): string | null => {
  // 1. Check cookies first (httpOnly secure cookie)
  if (req.cookies && req.cookies.roosterly_token) {
    return req.cookies.roosterly_token;
  }
  // 2. Check Authorization Bearer header as fallback
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1] || null;
  }
  return null;
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No session cookie or Bearer token provided.',
      });
      return;
    }

    const decoded = jwt.verify(token, getJwtSecret()) as {
      _id: string;
      email: string;
      name: string;
      roles: string[];
    };

    const user = await User.findById(decoded._id).select('-passwordHash');
    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({
        success: false,
        message: 'User account not found or is inactive.',
      });
      return;
    }

    req.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      roles: user.roles,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.',
    });
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, getJwtSecret()) as {
        _id: string;
        email: string;
        name: string;
        roles: string[];
      };
      const user = await User.findById(decoded._id).select('-passwordHash');
      if (user && user.status === 'ACTIVE') {
        req.user = {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          roles: user.roles,
        };
      }
    }
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
};
