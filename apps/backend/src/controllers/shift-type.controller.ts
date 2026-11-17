import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ShiftType } from '../models/ShiftType.js';
import { Team } from '../models/Team.js';

export const createShiftTypeSchema = z.object({
  teamId: z.string().optional(),
  name: z.string().min(2, 'Name is required'),
  shortCode: z.string().min(1).max(5).toUpperCase(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  durationHours: z.number().min(0.5).max(24),
  isOvernight: z.boolean().default(false),
  colorBg: z.string().default('#E0F2FE'),
  colorText: z.string().default('#0369A1'),
  description: z.string().optional(),
});

export const updateShiftTypeSchema = createShiftTypeSchema.partial();

export const getShiftTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teamId = req.query.teamId as string;
    const organizationId = req.query.organizationId as string;

    const query: Record<string, any> = { active: true };
    if (teamId) {
      query.$or = [{ teamId }, { teamId: { $exists: false } }, { teamId: null }];
    } else if (organizationId) {
      query.organizationId = organizationId;
    }

    const shiftTypes = await ShiftType.find(query).sort({ startTime: 1 });
    res.json({ shiftTypes });
  } catch (error) {
    next(error);
  }
};

export const createShiftType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      teamId,
      name,
      shortCode,
      startTime,
      endTime,
      durationHours,
      isOvernight,
      colorBg,
      colorText,
      description,
    } = req.body;

    let organizationId = req.body.organizationId;
    if (teamId && !organizationId) {
      const team = await Team.findById(teamId);
      if (team) {
        organizationId = team.organizationId;
      }
    }

    if (!organizationId) {
      res.status(400).json({ error: 'Organization context required' });
      return;
    }

    const shiftType = await ShiftType.create({
      organizationId,
      teamId,
      name,
      shortCode,
      startTime,
      endTime,
      durationHours,
      isOvernight,
      colorBg,
      colorText,
      description,
      active: true,
    });

    res.status(201).json({
      message: 'Shift type created successfully',
      shiftType,
    });
  } catch (error) {
    next(error);
  }
};

export const updateShiftType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const shiftType = await ShiftType.findByIdAndUpdate(id, req.body, { new: true });
    if (!shiftType) {
      res.status(404).json({ error: 'Shift type not found' });
      return;
    }

    res.json({
      message: 'Shift type updated successfully',
      shiftType,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteShiftType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const shiftType = await ShiftType.findByIdAndUpdate(id, { active: false }, { new: true });
    if (!shiftType) {
      res.status(404).json({ error: 'Shift type not found' });
      return;
    }

    res.json({ message: 'Shift type deactivated successfully' });
  } catch (error) {
    next(error);
  }
};
