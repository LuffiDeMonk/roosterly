import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models/User.js';

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

const JWT_SECRET = process.env.JWT_SECRET || 'roosterly-dev-secret-jwt-key-2026';

export const generateToken = (user: { _id: any; email: string; name: string; roles: string[] }): string => {
  return jwt.sign(
    {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      roles: user.roles,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. No Bearer token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Malformed authorization token.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      _id: string;
      email: string;
      name: string;
      roles: string[];
    };

    const user = await User.findById(decoded._id).select('-passwordHash');
    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ error: 'User account not found or is inactive.' });
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
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as {
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
