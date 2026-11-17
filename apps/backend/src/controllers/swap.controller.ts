import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose, { Types } from 'mongoose';
import { SwapRequest } from '../models/SwapRequest.js';
import { Assignment } from '../models/Assignment.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { Membership } from '../models/Membership.js';

export const createSwapSchema = z.object({
  teamId: z.string(),
  type: z.enum(['DIRECT', 'BROADCAST']).default('DIRECT'),
  requesterAssignmentId: z.string(),
  targetUserId: z.string().optional(),
  targetAssignmentId: z.string().optional(),
  reason: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const acceptSwapSchema = z.object({
  targetAssignmentId: z.string().optional(), // In case of broadcast, claimant can offer their assignment to swap
});

export const reviewSwapSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  supervisorNote: z.string().optional(),
});

export const getSwapRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teamId, status, view } = req.query;

    const query: Record<string, any> = {};
    if (teamId) query.teamId = teamId;
    if (status) query.status = status;

    if (view === 'my' && req.user) {
      query.$or = [{ requesterId: req.user._id }, { targetUserId: req.user._id }];
    }

    const swaps = await SwapRequest.find(query)
      .populate('requesterId', 'name email avatar roles')
      .populate('targetUserId', 'name email avatar roles')
      .populate({
        path: 'requesterAssignmentId',
        populate: { path: 'shiftTypeId', select: 'name shortCode startTime endTime colorBg colorText' },
      })
      .populate({
        path: 'targetAssignmentId',
        populate: { path: 'shiftTypeId', select: 'name shortCode startTime endTime colorBg colorText' },
      })
      .sort({ createdAt: -1 });

    res.json({ swaps });
  } catch (error) {
    next(error);
  }
};

export const createSwapRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const {
      teamId,
      type,
      requesterAssignmentId,
      targetUserId,
      targetAssignmentId,
      reason,
      expiresAt,
    } = req.body;

    const requesterAssignment = await Assignment.findById(requesterAssignmentId);
    if (!requesterAssignment) {
      res.status(404).json({ error: 'Requester assignment not found' });
      return;
    }

    if (requesterAssignment.employeeId.toString() !== req.user._id) {
      res.status(403).json({ error: 'You can only swap shifts assigned to you' });
      return;
    }

    if (requesterAssignment.startAt < new Date()) {
      res.status(400).json({ error: 'Cannot swap a shift that has already occurred or started' });
      return;
    }

    if (type === 'DIRECT') {
      if (!targetUserId) {
        res.status(400).json({ error: 'targetUserId is required for direct swaps' });
        return;
      }
      if (targetUserId === req.user._id) {
        res.status(400).json({ error: 'Cannot propose a swap with yourself' });
        return;
      }
    }

    const defaultExpiry = new Date(requesterAssignment.startAt);
    defaultExpiry.setHours(defaultExpiry.getHours() - 2); // default expires 2h before shift start

    const swap = await SwapRequest.create({
      organizationId: requesterAssignment.organizationId,
      teamId,
      type,
      requesterId: req.user._id,
      requesterAssignmentId,
      targetUserId: targetUserId ? new Types.ObjectId(targetUserId) : undefined,
      targetAssignmentId: targetAssignmentId ? new Types.ObjectId(targetAssignmentId) : undefined,
      status: 'OPEN',
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : defaultExpiry,
    });

    // Send notification to target user or team
    if (type === 'DIRECT' && targetUserId) {
      await Notification.create({
        userId: targetUserId,
        organizationId: requesterAssignment.organizationId,
        type: 'SWAP_REQUESTED',
        title: 'New Shift Swap Request',
        message: `${req.user.name} has requested a shift swap with you.`,
        data: { swapId: swap._id, teamId },
      });
    }

    res.status(201).json({
      message: 'Swap request created successfully',
      swap,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptSwapRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { targetAssignmentId } = req.body;

    const swap = await SwapRequest.findById(id);
    if (!swap) {
      res.status(404).json({ error: 'Swap request not found' });
      return;
    }

    if (swap.status !== 'OPEN') {
      res.status(400).json({ error: `Cannot accept swap with status: ${swap.status}` });
      return;
    }

    if (swap.expiresAt < new Date()) {
      swap.status = 'EXPIRED';
      await swap.save();
      res.status(400).json({ error: 'This swap request has expired' });
      return;
    }

    if (swap.type === 'DIRECT') {
      if (swap.targetUserId?.toString() !== req.user._id) {
        res.status(403).json({ error: 'You are not the designated recipient of this swap request' });
        return;
      }
    } else {
      // Broadcast claim
      if (swap.requesterId.toString() === req.user._id) {
        res.status(400).json({ error: 'You cannot claim your own broadcast' });
        return;
      }
      swap.targetUserId = new Types.ObjectId(req.user._id);
    }

    if (targetAssignmentId) {
      swap.targetAssignmentId = new Types.ObjectId(targetAssignmentId);
    }

    // Advance to Phase 2: ACCEPTED / PENDING_APPROVAL
    swap.status = 'PENDING_APPROVAL';
    await swap.save();

    // Notify requester
    await Notification.create({
      userId: swap.requesterId,
      organizationId: swap.organizationId,
      type: 'SWAP_ACCEPTED',
      title: 'Shift Swap Accepted',
      message: `${req.user.name} accepted your shift swap. It is now awaiting supervisor approval.`,
      data: { swapId: swap._id, teamId: swap.teamId },
    });

    res.json({
      message: 'Swap accepted and submitted for supervisor approval',
      swap,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewSwapRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { action, supervisorNote } = req.body;

    const swap = await SwapRequest.findById(id);
    if (!swap) {
      res.status(404).json({ error: 'Swap request not found' });
      return;
    }

    if (swap.status !== 'PENDING_APPROVAL' && swap.status !== 'ACCEPTED') {
      res.status(400).json({ error: `Swap cannot be reviewed in status: ${swap.status}` });
      return;
    }

    if (action === 'REJECT') {
      swap.status = 'REJECTED';
      swap.supervisorNote = supervisorNote;
      swap.reviewedBy = new Types.ObjectId(req.user._id);
      swap.reviewedAt = new Date();
      await swap.save();

      // Notify parties
      await Notification.create({
        userId: swap.requesterId,
        organizationId: swap.organizationId,
        type: 'SWAP_REJECTED',
        title: 'Shift Swap Rejected',
        message: `Your shift swap was rejected by supervisor: ${supervisorNote || 'No reason provided'}`,
        data: { swapId: swap._id },
      });

      res.json({ message: 'Swap request rejected', swap });
      return;
    }

    // APPROVAL: Perform Atomic Assignment Exchange
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const reqAssignment = await Assignment.findById(swap.requesterAssignmentId).session(session);
      if (!reqAssignment) {
        throw new Error('Requester assignment record no longer exists');
      }

      if (swap.targetAssignmentId) {
        // Two-way trade
        const targetAssignment = await Assignment.findById(swap.targetAssignmentId).session(session);
        if (!targetAssignment) {
          throw new Error('Target assignment record no longer exists');
        }

        // Swap the assigned employees atomically
        const originalReqEmployee = reqAssignment.employeeId;
        const originalTargetEmployee = targetAssignment.employeeId;

        reqAssignment.employeeId = originalTargetEmployee;
        reqAssignment.source = 'SWAP';
        await reqAssignment.save({ session });

        targetAssignment.employeeId = originalReqEmployee;
        targetAssignment.source = 'SWAP';
        await targetAssignment.save({ session });
      } else if (swap.targetUserId) {
        // One-way shift transfer / claim
        reqAssignment.employeeId = swap.targetUserId;
        reqAssignment.source = 'SWAP';
        await reqAssignment.save({ session });
      }

      swap.status = 'APPROVED';
      swap.supervisorNote = supervisorNote;
      swap.reviewedBy = new Types.ObjectId(req.user._id);
      swap.reviewedAt = new Date();
      await swap.save({ session });

      await AuditLog.create(
        [
          {
            organizationId: swap.organizationId,
            actorId: req.user._id,
            action: 'SWAP.APPROVE',
            resourceType: 'SwapRequest',
            resourceId: swap._id.toString(),
            metadata: {
              requesterId: swap.requesterId,
              targetUserId: swap.targetUserId,
              requesterAssignmentId: swap.requesterAssignmentId,
              targetAssignmentId: swap.targetAssignmentId,
            },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      // Post-transaction notifications
      await Notification.create([
        {
          userId: swap.requesterId,
          organizationId: swap.organizationId,
          type: 'SWAP_APPROVED',
          title: 'Shift Swap Approved',
          message: 'Your shift swap was approved by supervisor and your schedule is updated.',
          data: { swapId: swap._id },
        },
        ...(swap.targetUserId
          ? [
              {
                userId: swap.targetUserId,
                organizationId: swap.organizationId,
                type: 'SWAP_APPROVED' as const,
                title: 'Shift Swap Approved',
                message: 'The shift swap was approved and your schedule has been updated.',
                data: { swapId: swap._id },
              },
            ]
          : []),
      ]);

      res.json({
        message: 'Shift swap approved and assignments reconciled atomically',
        swap,
      });
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      res.status(500).json({ error: err.message || 'Failed to reconcile shift swap' });
    }
  } catch (error) {
    next(error);
  }
};

export const cancelSwapRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const swap = await SwapRequest.findById(id);
    if (!swap) {
      res.status(404).json({ error: 'Swap request not found' });
      return;
    }

    if (swap.requesterId.toString() !== req.user._id) {
      res.status(403).json({ error: 'Only the requester can withdraw this swap request' });
      return;
    }

    if (swap.status === 'APPROVED' || swap.status === 'REJECTED') {
      res.status(400).json({ error: 'Cannot cancel a resolved swap request' });
      return;
    }

    swap.status = 'WITHDRAWN';
    await swap.save();

    res.json({ message: 'Swap request withdrawn successfully', swap });
  } catch (error) {
    next(error);
  }
};
