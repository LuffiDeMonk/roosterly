import type { Request, Response, NextFunction } from 'express';
import { Assignment } from '../models/Assignment.js';
import { SwapRequest } from '../models/SwapRequest.js';
import { Membership } from '../models/Membership.js';
import { Team } from '../models/Team.js';
import { Organization } from '../models/Organization.js';

export const getDailyStaffingCoverage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teamId = req.query.teamId as string;
    if (!teamId) {
      res.status(400).json({ error: 'teamId is required' });
      return;
    }

    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const org = await Organization.findById(team.organizationId);
    const targetRatios = org?.settings?.shiftStaffingRatios || {
      morning: 2,
      evening: 2,
      night: 1,
    };

    const targetDate = req.query.date ? new Date(req.query.date as string) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(0, 0, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const assignments = await Assignment.find({
      teamId: team._id,
      date: { $gte: dayStart, $lte: dayEnd },
      status: 'ASSIGNED',
    })
      .populate('employeeId', 'name email avatar roles')
      .populate('shiftTypeId', 'name shortCode startTime endTime isOvernight durationHours colorBg colorText');

    const buckets = {
      morning: [] as any[],
      evening: [] as any[],
      night: [] as any[],
    };

    for (const a of assignments) {
      const shift = a.shiftTypeId as any;
      if (!shift) continue;

      const hour = parseInt(shift.startTime.split(':')[0], 10);
      if (shift.isOvernight || hour >= 19 || hour < 5) {
        buckets.night.push(a);
      } else if (hour >= 12 && hour < 19) {
        buckets.evening.push(a);
      } else {
        buckets.morning.push(a);
      }
    }

    const coverageSummary = {
      morning: {
        assigned: buckets.morning.length,
        target: targetRatios.morning ?? 2,
        shortage: Math.max(0, (targetRatios.morning ?? 2) - buckets.morning.length),
        status: buckets.morning.length >= (targetRatios.morning ?? 2) ? 'ADEQUATE' : 'UNDERSTAFFED',
        staff: buckets.morning.map((a) => ({
          assignmentId: a._id,
          employee: a.employeeId,
          shift: a.shiftTypeId,
        })),
      },
      evening: {
        assigned: buckets.evening.length,
        target: targetRatios.evening ?? 2,
        shortage: Math.max(0, (targetRatios.evening ?? 2) - buckets.evening.length),
        status: buckets.evening.length >= (targetRatios.evening ?? 2) ? 'ADEQUATE' : 'UNDERSTAFFED',
        staff: buckets.evening.map((a) => ({
          assignmentId: a._id,
          employee: a.employeeId,
          shift: a.shiftTypeId,
        })),
      },
      night: {
        assigned: buckets.night.length,
        target: targetRatios.night ?? 1,
        shortage: Math.max(0, (targetRatios.night ?? 1) - buckets.night.length),
        status: buckets.night.length >= (targetRatios.night ?? 1) ? 'ADEQUATE' : 'UNDERSTAFFED',
        staff: buckets.night.map((a) => ({
          assignmentId: a._id,
          employee: a.employeeId,
          shift: a.shiftTypeId,
        })),
      },
    };

    const isFullyStaffed =
      coverageSummary.morning.shortage === 0 &&
      coverageSummary.evening.shortage === 0 &&
      coverageSummary.night.shortage === 0;

    res.json({
      date: dayStart.toISOString().split('T')[0],
      team: {
        _id: team._id,
        name: team.name,
      },
      isFullyStaffed,
      coverageSummary,
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingSupervisorActions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teamId = req.query.teamId as string;
    if (!teamId) {
      res.status(400).json({ error: 'teamId is required' });
      return;
    }

    const [pendingMembers, pendingSwaps] = await Promise.all([
      Membership.find({ teamId, status: 'PENDING' })
        .populate('userId', 'name email avatar roles')
        .sort({ createdAt: -1 }),
      SwapRequest.find({ teamId, status: 'PENDING_APPROVAL' })
        .populate('requesterId', 'name email avatar roles')
        .populate('targetUserId', 'name email avatar roles')
        .populate({
          path: 'requesterAssignmentId',
          populate: { path: 'shiftTypeId', select: 'name shortCode startTime endTime' },
        })
        .populate({
          path: 'targetAssignmentId',
          populate: { path: 'shiftTypeId', select: 'name shortCode startTime endTime' },
        })
        .sort({ createdAt: -1 }),
    ]);

    res.json({
      teamId,
      counts: {
        pendingMembers: pendingMembers.length,
        pendingSwaps: pendingSwaps.length,
        totalActionsRequired: pendingMembers.length + pendingSwaps.length,
      },
      pendingMembers,
      pendingSwaps,
    });
  } catch (error) {
    next(error);
  }
};
