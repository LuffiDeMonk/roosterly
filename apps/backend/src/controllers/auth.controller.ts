import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { Team } from '../models/Team.js';
import { Membership } from '../models/Membership.js';
import { generateToken } from '../middleware/auth.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  teamCode: z.string().optional(),
  organizationName: z.string().optional(),
  role: z.enum(['NURSE', 'DOCTOR', 'SUPERVISOR', 'STAFF']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, teamCode, organizationName, role } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole = role || 'STAFF';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      roles: [userRole],
      status: 'ACTIVE',
      isEmailVerified: false,
    });

    let assignedMembership = null;

    // If joining existing team via code
    if (teamCode) {
      const cleanCode = teamCode.trim().toUpperCase();
      const team = await Team.findOne({ code: cleanCode });
      if (team) {
        // First member or supervisor can be admin, staff joins as PENDING
        const existingMembersCount = await Membership.countDocuments({ teamId: team._id });
        const isFirst = existingMembersCount === 0;

        assignedMembership = await Membership.create({
          userId: user._id,
          organizationId: team.organizationId,
          teamId: team._id,
          role: isFirst ? 'ADMIN' : 'MEMBER',
          roles: isFirst ? ['TEAM_ADMIN', 'SUPERVISOR'] : ['STAFF'],
          status: isFirst ? 'ACTIVE' : 'PENDING',
        });
      }
    } else if (organizationName) {
      // Creator creating new organization + first ward
      const orgCode = organizationName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'ORG01';
      const org = await Organization.create({
        name: organizationName,
        code: `${orgCode}-${Math.floor(1000 + Math.random() * 9000)}`,
        timezone: 'UTC',
        status: 'ACTIVE',
        tier: 'FREE',
      });

      const team = await Team.create({
        organizationId: org._id,
        name: 'General Ward',
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

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        preferences: user.preferences,
      },
      membership: assignedMembership,
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
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Account is currently inactive or suspended' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const memberships = await Membership.find({ userId: user._id })
      .populate('teamId', 'name code tier status')
      .populate('organizationId', 'name code timezone tier');

    const token = generateToken(user);

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        preferences: user.preferences,
      },
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
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const memberships = await Membership.find({ userId: user._id })
      .populate('teamId', 'name code tier status settings')
      .populate('organizationId', 'name code timezone tier settings');

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        avatar: user.avatar,
        phone: user.phone,
        preferences: user.preferences,
      },
      memberships,
    });
  } catch (error) {
    next(error);
  }
};
