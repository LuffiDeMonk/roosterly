import mongoose, { Document, Schema, Types } from 'mongoose';

export type RosterStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface IRoster {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  facilityId?: Types.ObjectId;
  teamId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: RosterStatus;
  version: number;
  notes?: string;
  createdBy: Types.ObjectId;
  publishedBy?: Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type RosterDocument = Document<Types.ObjectId, object, IRoster> & IRoster;

const RosterSchema = new Schema<IRoster>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      required: false,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

RosterSchema.index({ teamId: 1, startDate: 1 }, { unique: true });
RosterSchema.index({ organizationId: 1, status: 1 });

export const Roster =
  mongoose.models.Roster || mongoose.model<IRoster>('Roster', RosterSchema);
