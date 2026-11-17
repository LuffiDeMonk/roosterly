import mongoose, { Document, Schema, Types } from 'mongoose';

export type SwapType = 'DIRECT' | 'BROADCAST';

export type SwapStatus =
  | 'OPEN'
  | 'ACCEPTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'DECLINED'
  | 'WITHDRAWN'
  | 'EXPIRED';

export interface ISwapRequest {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  teamId: Types.ObjectId;
  type: SwapType;
  requesterId: Types.ObjectId;
  requesterAssignmentId: Types.ObjectId;
  targetUserId?: Types.ObjectId;
  targetAssignmentId?: Types.ObjectId;
  status: SwapStatus;
  reason?: string;
  supervisorNote?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SwapRequestDocument = Document<Types.ObjectId, object, ISwapRequest> & ISwapRequest;

const SwapRequestSchema = new Schema<ISwapRequest>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['DIRECT', 'BROADCAST'],
      default: 'DIRECT',
    },
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requesterAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    targetAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: false,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'OPEN',
        'ACCEPTED',
        'PENDING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'DECLINED',
        'WITHDRAWN',
        'EXPIRED',
      ],
      default: 'OPEN',
      index: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    supervisorNote: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

SwapRequestSchema.index({ organizationId: 1, status: 1 });
SwapRequestSchema.index({ teamId: 1, status: 1 });
SwapRequestSchema.index({ requesterId: 1, status: 1 });
SwapRequestSchema.index({ targetUserId: 1, status: 1 });

export const SwapRequest =
  mongoose.models.SwapRequest ||
  mongoose.model<ISwapRequest>('SwapRequest', SwapRequestSchema);
