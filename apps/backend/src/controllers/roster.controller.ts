import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Roster } from '../models/Roster.js';
import { Assignment } from '../models/Assignment.js';
import { Membership } from '../models/Membership.js';
import { ShiftType } from '../models/ShiftType.js';
import { Team } from '../models/Team.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';

// Helper to calculate Monday anchor for a given date
export const getMondayAnchor = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getUTCDay(); // 0 is Sunday, 1 is Monday...
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// Helper to get 7 days array from Monday
export const getWeekDays = (monday: Date): Date[] => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    days.push(d);
  }
  return days;
};

export const getWeekRosterSchema = z.object({
  teamId: z.string(),
  date: z.string().optional(), // YYYY-MM-DD
});

export const saveDraftAssignmentsSchema = z.object({
  teamId: z.string(),
  startDate: z.string(), // ISO or YYYY-MM-DD
  assignments: z.array(
    z.object({
      employeeId: z.string(),
      shiftTypeId: z.string(),
      date: z.string(),
      startAt: z.string().optional(),
      endAt: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
});

export const updateAssignmentSchema = z.object({
  teamId: z.string(),
  rosterId: z.string(),
  employeeId: z.string(),
  shiftTypeId: z.string(),
  date: z.string(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  notes: z.string().optional(),
});

export const getWeekRoster = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teamId = req.query.teamId as string;
    if (!teamId) {
      res.status(400).json({ error: 'teamId query parameter is required' });
      return;
    }

    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const queryDate = req.query.date ? new Date(req.query.date as string) : new Date();
    const monday = getMondayAnchor(queryDate);
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    const weekDays = getWeekDays(monday);

    // 1. Find or create Roster document
    let roster = await Roster.findOne({
      teamId: team._id,
      startDate: {
        $gte: new Date(monday.getTime() - 1000 * 60 * 60 * 12),
        $lte: new Date(monday.getTime() + 1000 * 60 * 60 * 12),
      },
    });

    if (!roster) {
      roster = await Roster.create({
        organizationId: team.organizationId,
        teamId: team._id,
        startDate: monday,
        endDate: sunday,
        status: 'DRAFT',
        createdBy: req.user?._id || new Types.ObjectId(),
      });
    }

    // 2. Fetch all active team members
    const memberships = await Membership.find({
      teamId: team._id,
      status: 'ACTIVE',
    }).populate('userId', 'name email avatar roles');

    // 3. Fetch all active shift types for this team/org
    const shiftTypes = await ShiftType.find({
      organizationId: team.organizationId,
      active: true,
      $or: [{ teamId: team._id }, { teamId: { $exists: false } }, { teamId: null }],
    });

    // 4. Fetch all assignments for this roster / date range
    const assignments = await Assignment.find({
      teamId: team._id,
      date: { $gte: monday, $lte: sunday },
    }).populate('shiftTypeId', 'name shortCode startTime endTime colorBg colorText durationHours');

    // 5. Structure Matrix: mapping each employee to their 7-day assignments
    const matrix = memberships.map((member) => {
      const user = member.userId as any;
      const employeeAssignments = assignments.filter(
        (a) => a.employeeId.toString() === user._id.toString()
      );

      const days = weekDays.map((d) => {
        const dateStr = d.toISOString().split('T')[0];
        const dayAssignment = employeeAssignments.find(
          (a) => a.date.toISOString().split('T')[0] === dateStr
        );
        return {
          date: dateStr,
          assignment: dayAssignment || null,
        };
      });

      return {
        member: {
          _id: member._id,
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          roles: user.roles,
          teamRole: member.role,
        },
        days,
      };
    });

    res.json({
      roster,
      team: {
        _id: team._id,
        name: team.name,
        code: team.code,
      },
      weekRange: {
        startDate: monday.toISOString(),
        endDate: sunday.toISOString(),
        days: weekDays.map((d) => d.toISOString().split('T')[0]),
      },
      shiftTypes,
      matrix,
    });
  } catch (error) {
    next(error);
  }
};

export const saveDraftAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teamId, startDate, assignments: rawAssignments } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const monday = getMondayAnchor(new Date(startDate));
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    let roster = await Roster.findOne({
      teamId: team._id,
      startDate: {
        $gte: new Date(monday.getTime() - 1000 * 60 * 60 * 12),
        $lte: new Date(monday.getTime() + 1000 * 60 * 60 * 12),
      },
    });

    if (!roster) {
      roster = await Roster.create({
        organizationId: team.organizationId,
        teamId: team._id,
        startDate: monday,
        endDate: sunday,
        status: 'DRAFT',
        createdBy: req.user?._id,
      });
    }

    // Process assignments in bulk
    const savedAssignments = [];

    for (const item of rawAssignments) {
      const shiftDate = new Date(item.date);
      shiftDate.setUTCHours(0, 0, 0, 0);

      const shiftType = await ShiftType.findById(item.shiftTypeId);
      if (!shiftType) continue;

      // Calculate startAt and endAt based on shiftType 24h format
      const [startH, startM] = shiftType.startTime.split(':').map(Number);
      const [endH, endM] = shiftType.endTime.split(':').map(Number);

      const startAt = new Date(shiftDate);
      startAt.setUTCHours(startH, startM, 0, 0);

      const endAt = new Date(shiftDate);
      if (shiftType.isOvernight) {
        endAt.setUTCDate(endAt.getUTCDate() + 1);
      }
      endAt.setUTCHours(endH, endM, 0, 0);

      const updated = await Assignment.findOneAndUpdate(
        {
          teamId: team._id,
          employeeId: item.employeeId,
          date: shiftDate,
        },
        {
          organizationId: team.organizationId,
          rosterId: roster._id,
          shiftTypeId: item.shiftTypeId,
          startAt: item.startAt ? new Date(item.startAt) : startAt,
          endAt: item.endAt ? new Date(item.endAt) : endAt,
          status: 'ASSIGNED',
          source: 'MANUAL',
          notes: item.notes,
        },
        { upsert: true, new: true }
      );

      savedAssignments.push(updated);
    }

    res.json({
      message: 'Draft assignments saved successfully',
      rosterId: roster._id,
      count: savedAssignments.length,
    });
  } catch (error) {
    next(error);
  }
};

export const publishRoster = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const roster = await Roster.findById(id);
    if (!roster) {
      res.status(404).json({ error: 'Roster not found' });
      return;
    }

    roster.status = 'PUBLISHED';
    roster.publishedBy = req.user?._id ? new Types.ObjectId(req.user._id) : undefined;
    roster.publishedAt = new Date();
    await roster.save();

    // Create notifications for all active team members
    const members = await Membership.find({ teamId: roster.teamId, status: 'ACTIVE' });
    const notifications = members.map((m) => ({
      userId: m.userId,
      organizationId: roster.organizationId,
      type: 'ROSTER_PUBLISHED',
      title: 'Weekly Schedule Published',
      message: `The schedule for week starting ${roster.startDate.toISOString().split('T')[0]} is now live.`,
      data: { rosterId: roster._id, teamId: roster.teamId },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    if (req.user) {
      await AuditLog.create({
        organizationId: roster.organizationId,
        actorId: req.user._id,
        action: 'ROSTER.PUBLISH',
        resourceType: 'Roster',
        resourceId: roster._id.toString(),
        metadata: {
          teamId: roster.teamId,
          startDate: roster.startDate,
          endDate: roster.endDate,
        },
      });
    }

    res.json({
      message: 'Roster published successfully',
      roster,
    });
  } catch (error) {
    next(error);
  }
};

export const setSingleAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teamId, rosterId, employeeId, shiftTypeId, date, notes } = req.body;

    const shiftDate = new Date(date);
    shiftDate.setUTCHours(0, 0, 0, 0);

    const shiftType = await ShiftType.findById(shiftTypeId);
    if (!shiftType) {
      res.status(404).json({ error: 'Shift type not found' });
      return;
    }

    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const [startH, startM] = shiftType.startTime.split(':').map(Number);
    const [endH, endM] = shiftType.endTime.split(':').map(Number);

    const startAt = new Date(shiftDate);
    startAt.setUTCHours(startH, startM, 0, 0);

    const endAt = new Date(shiftDate);
    if (shiftType.isOvernight) endAt.setUTCDate(endAt.getUTCDate() + 1);
    endAt.setUTCHours(endH, endM, 0, 0);

    const assignment = await Assignment.findOneAndUpdate(
      {
        teamId: team._id,
        employeeId,
        date: shiftDate,
      },
      {
        organizationId: team.organizationId,
        rosterId,
        shiftTypeId,
        startAt,
        endAt,
        status: 'ASSIGNED',
        source: 'MANUAL',
        notes,
      },
      { upsert: true, new: true }
    ).populate('shiftTypeId');

    res.json({
      message: 'Assignment updated',
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const removeAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const deleted = await Assignment.findByIdAndDelete(assignmentId);
    if (!deleted) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    next(error);
  }
};
