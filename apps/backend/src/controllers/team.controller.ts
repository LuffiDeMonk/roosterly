import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Team } from '../models/Team.js';
import { Membership } from '../models/Membership.js';
import { Organization } from '../models/Organization.js';

// Unambiguous 6-char code character set (omits 0, O, 1, I)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateTeamCode = (): string => {
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return result;
};

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  department: z.string().optional(),
  description: z.string().optional(),
  organizationId: z.string().optional(),
  tier: z.enum(['FREE', 'PRO']).default('FREE'),
  settings: z
    .object({
      defaultShiftDurationHours: z.number().default(8),
      requireSupervisorApproval: z.boolean().default(true),
    })
    .optional(),
});

export const joinTeamSchema = z.object({
  code: z.string().min(4, 'Code is required'),
});

export const updateMemberStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED', 'SUSPENDED']),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'MEMBER']).optional(),
});

export const createTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { name, department, description, tier, settings } = req.body;
    let organizationId = req.body.organizationId;

    if (!organizationId) {
      // Find user's existing organization or create a default one
      const existingMembership = await Membership.findOne({ userId: req.user._id });
      if (existingMembership) {
        organizationId = existingMembership.organizationId;
      } else {
        const org = await Organization.create({
          name: `${req.user.name}'s Organization`,
          code: `ORG-${Math.floor(1000 + Math.random() * 9000)}`,
          timezone: 'UTC',
        });
        organizationId = org._id;
      }
    }

    // Generate unique 6-character code
    let code = generateTeamCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await Team.findOne({ code });
      if (!existing) {
        isUnique = true;
      } else {
        code = generateTeamCode();
        attempts++;
      }
    }

    const team = await Team.create({
      organizationId,
      name,
      department: department || description,
      description,
      code,
      tier: tier || 'FREE',
      maxMembers: tier === 'PRO' ? 100 : 5,
      status: 'ACTIVE',
      settings: settings || {
        defaultShiftDurationHours: 8,
        requireSupervisorApproval: true,
      },
    });

    const membership = await Membership.create({
      userId: req.user._id,
      organizationId,
      teamId: team._id,
      role: 'ADMIN',
      roles: ['TEAM_ADMIN', 'SUPERVISOR'],
      status: 'ACTIVE',
    });

    res.status(201).json({
      success: true,
      message: 'Ward team created successfully',
      team,
      membership,
    });
  } catch (error) {
    next(error);
  }
};

export const joinTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { code } = req.body;
    const cleanCode = code.trim().toUpperCase();

    const team = await Team.findOne({ code: cleanCode, status: 'ACTIVE' });
    if (!team) {
      res.status(404).json({ error: 'Team not found with that code' });
      return;
    }

    const existingMembership = await Membership.findOne({
      userId: req.user._id,
      teamId: team._id,
    });

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        res.status(400).json({ error: 'You are already an active member of this team' });
        return;
      }
      if (existingMembership.status === 'PENDING') {
        res.status(400).json({ error: 'Your membership request is already pending supervisor approval' });
        return;
      }
      // If was previously rejected or suspended, re-request
      existingMembership.status = 'PENDING';
      await existingMembership.save();
      res.json({
        message: 'Membership request re-submitted',
        membership: existingMembership,
      });
      return;
    }

    // Check member limits if FREE tier
    if (team.tier === 'FREE') {
      const activeMembersCount = await Membership.countDocuments({
        teamId: team._id,
        status: 'ACTIVE',
      });
      if (activeMembersCount >= team.maxMembers) {
        res.status(403).json({
          error: `This free ward is capped at ${team.maxMembers} members. Upgrade to PRO to add more members.`,
        });
        return;
      }
    }

    const membership = await Membership.create({
      userId: req.user._id,
      organizationId: team.organizationId,
      teamId: team._id,
      role: 'MEMBER',
      roles: ['STAFF'],
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Join request submitted and awaiting supervisor approval',
      team: {
        _id: team._id,
        name: team.name,
        code: team.code,
      },
      membership,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTeams = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const memberships = await Membership.find({
      userId: req.user._id,
      status: { $ne: 'REJECTED' },
    })
      .populate('teamId')
      .populate('organizationId', 'name code timezone');

    const teamMap = new Map<string, any>();
    for (const m of memberships) {
      if (m.teamId && (m.teamId as any)._id) {
        teamMap.set((m.teamId as any)._id.toString(), m.teamId);
      }
    }

    // Check if user is ORG_ADMIN or PLATFORM_ADMIN
    const isOrgAdmin =
      Boolean(req.user.roles?.includes('ORG_ADMIN')) ||
      Boolean(req.user.roles?.includes('PLATFORM_ADMIN')) ||
      memberships.some(
        (m) => m.roles?.includes('ORG_ADMIN') || m.role === 'ADMIN'
      );

    if (isOrgAdmin) {
      const orgIds = memberships
        .map((m) => {
          const org = m.organizationId as any;
          return org?._id || org;
        })
        .filter(Boolean);

      if (orgIds.length > 0) {
        const orgTeams = await Team.find({
          organizationId: { $in: orgIds },
          status: 'ACTIVE',
        }).populate('organizationId', 'name code timezone');

        for (const t of orgTeams) {
          if (!teamMap.has(t._id.toString())) {
            teamMap.set(t._id.toString(), t);
          }
        }
      }
    }

    const teams = Array.from(teamMap.values());

    res.json({
      success: true,
      teams,
      memberships,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId).populate('organizationId', 'name code timezone');
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const memberCount = await Membership.countDocuments({ teamId, status: 'ACTIVE' });
    const pendingCount = await Membership.countDocuments({ teamId, status: 'PENDING' });

    res.json({
      team,
      stats: {
        activeMembers: memberCount,
        pendingMembers: pendingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teamId } = req.params;
    const status = req.query.status as string;

    const query: Record<string, any> = { teamId };
    if (status) {
      query.status = status;
    }

    const members = await Membership.find(query)
      .populate('userId', 'name email avatar phone roles')
      .sort({ createdAt: -1 });

    res.json({ members });
  } catch (error) {
    next(error);
  }
};

export const updateMemberStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teamId, memberId } = req.params;
    const { status, role } = req.body;

    const membership = await Membership.findOne({ _id: memberId, teamId });
    if (!membership) {
      res.status(404).json({ error: 'Membership record not found' });
      return;
    }

    if (status) membership.status = status;
    if (role) {
      membership.role = role;
      if (role === 'SUPERVISOR' && !membership.roles.includes('SUPERVISOR')) {
        membership.roles.push('SUPERVISOR');
      }
    }

    await membership.save();

    res.json({
      message: `Member status updated to ${membership.status}`,
      membership,
    });
  } catch (error) {
    next(error);
  }
};
