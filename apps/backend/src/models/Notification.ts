import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'INVITATION'
  | 'ROSTER_PUBLISHED'
  | 'ROSTER_UPDATED'
  | 'ASSIGNMENT_CREATED'
  | 'SWAP_REQUESTED'
  | 'SWAP_ACCEPTED'
  | 'SWAP_APPROVED'
  | 'SWAP_REJECTED'
  | 'LEAVE_DECISION'
  | 'UPCOMING_SHIFT'
  | 'SYSTEM';

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = Document<Types.ObjectId, object, INotification> &
  INotification;

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'INVITATION',
        'ROSTER_PUBLISHED',
        'ROSTER_UPDATED',
        'ASSIGNMENT_CREATED',
        'SWAP_REQUESTED',
        'SWAP_ACCEPTED',
        'SWAP_APPROVED',
        'SWAP_REJECTED',
        'LEAVE_DECISION',
        'UPCOMING_SHIFT',
        'SYSTEM',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
