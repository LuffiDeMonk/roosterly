import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { Team } from '../models/Team.js';
import { Membership } from '../models/Membership.js';
import { generateToken } from '../middleware/auth.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  teamCode: z.string().optional(),
  organizationName: z.string().optional(),
  orgName: z.string().optional(),
  role: z.enum(['NURSE', 'DOCTOR', 'SUPERVISOR', 'STAFF']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const AUTH_COOKIE_NAME = 'roosterly_token';

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
};

const formatUser = (user: any) => {
  const fullName = user.name || '';
  const parts = fullName.split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  return {
    _id: user._id,
    name: fullName,
    firstName,
    lastName,
    email: user.email,
    roles: user.roles,
    status: user.status,
    avatar: user.avatar,
    phone: user.phone,
    preferences: user.preferences,
  };
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, firstName, lastName, email, password, teamCode, organizationName, orgName, role } = req.body;
    const orgTargetName = organizationName || orgName;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole = role || 'STAFF';
    const computedName = (name || `${firstName || ''} ${lastName || ''}`).trim() || 'Staff User';

    const user = await User.create({
      name: computedName,
      email: email.toLowerCase(),
      passwordHash,
      roles: [userRole],
      status: 'ACTIVE',
      isEmailVerified: false,
    });

    let assignedMembership = null;

    // If joining existing team via 6-char code
    if (teamCode) {
      const cleanCode = teamCode.trim().toUpperCase();
      const team = await Team.findOne({ code: cleanCode });
      if (team) {
        const existingMembersCount = await Membership.countDocuments({ teamId: team._id });
        const isFirst = existingMembersCount === 0;

        assignedMembership = await Membership.create({
          userId: user._id,
          organizationId: team.organizationId,
          teamId: team._id,
          role: isFirst ? 'ADMIN' : (userRole === 'SUPERVISOR' ? 'SUPERVISOR' : 'MEMBER'),
          roles: isFirst ? ['TEAM_ADMIN', 'SUPERVISOR'] : (userRole === 'SUPERVISOR' ? ['SUPERVISOR'] : ['STAFF']),
          status: isFirst ? 'ACTIVE' : (team.settings?.requireSupervisorApproval ? 'PENDING' : 'ACTIVE'),
        });
      }
    } else if (orgTargetName) {
      // Creator creating new organization + first clinical ward
      const orgCode = orgTargetName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'ROOST';
      const org = await Organization.create({
        name: orgTargetName,
        code: `${orgCode}-${Math.floor(1000 + Math.random() * 9000)}`,
        timezone: 'UTC',
        status: 'ACTIVE',
        tier: 'FREE',
      });

      const team = await Team.create({
        organizationId: org._id,
        name: 'General Clinical Ward',
        code: `WARD${Math.floor(10 + Math.random() * 89)}`,
        tier: 'FREE',
        status: 'ACTIVE',
      });

      assignedMembership = await Membership.create({
        userId: user._id,
        organizationId: org._id,
        teamId: team._id,
        role: 'ADMIN',
        roles: ['ORG_ADMIN', 'TEAM_ADMIN', 'SUPERVISOR'],
        status: 'ACTIVE',
      });

      user.roles = ['SUPERVISOR', 'ORG_ADMIN'];
      await user.save();
    }

    const token = generateToken(user);
    setAuthCookie(res, token);
    const memberships = assignedMembership ? [assignedMembership] : [];

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: formatUser(user),
      memberships,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ success: false, message: 'Account is currently inactive or suspended' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const memberships = await Membership.find({ userId: user._id })
      .populate('teamId', 'name code tier status department settings')
      .populate('organizationId', 'name code timezone tier');

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: formatUser(user),
      memberships,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const memberships = await Membership.find({ userId: user._id })
      .populate('teamId', 'name code tier status department settings')
      .populate('organizationId', 'name code timezone tier');

    res.json({
      success: true,
      user: formatUser(user),
      memberships,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { name, firstName, lastName, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (name || firstName || lastName) {
      user.name = (name || `${firstName || ''} ${lastName || ''}`).trim();
    }
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user || !user.passwordHash) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  clearAuthCookie(res);
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};
