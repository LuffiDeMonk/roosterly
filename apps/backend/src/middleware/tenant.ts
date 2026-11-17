import type { Request, Response, NextFunction } from 'express';
import { Membership } from '../models/Membership.js';
import { Team } from '../models/Team.js';

export const resolveTeamContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teamId =
      req.params.teamId ||
      (req.query.teamId as string) ||
      (req.headers['x-team-id'] as string) ||
      req.body?.teamId;

    if (!teamId) {
      next();
      return;
    }

    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    req.teamId = team._id.toString();
    req.organizationId = team.organizationId.toString();

    next();
  } catch (error) {
    next(error);
  }
};

export const requireTeamRole = (allowedRoles: ('ADMIN' | 'SUPERVISOR' | 'MEMBER')[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const teamId = req.teamId || req.params.teamId || (req.query.teamId as string) || req.body?.teamId;
      if (!teamId) {
        res.status(400).json({ error: 'Team context required for this operation' });
        return;
      }

      // Check if user has global platform admin role
      if (req.user.roles.includes('PLATFORM_ADMIN') || req.user.roles.includes('SUPER_ADMIN')) {
        next();
        return;
      }

      const membership = await Membership.findOne({
        userId: req.user._id,
        teamId: teamId,
        status: 'ACTIVE',
      });

      if (!membership) {
        res.status(403).json({ error: 'You are not an active member of this team' });
        return;
      }

      if (!allowedRoles.includes(membership.role)) {
        res.status(403).json({
          error: `Insufficient permissions. Requires one of: ${allowedRoles.join(', ')}`,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
