import mongoose, { Document, Schema, Types } from 'mongoose';

export type AssignmentStatus = 'ASSIGNED' | 'COMPLETED' | 'CANCELLED' | 'ABSENT';
export type AssignmentSource = 'MANUAL' | 'SWAP' | 'ADMIN_OVERRIDE' | 'AUTO_FILL';

export interface IAssignment {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  facilityId?: Types.ObjectId;
  teamId: Types.ObjectId;
  rosterId: Types.ObjectId;
  employeeId: Types.ObjectId;
  shiftTypeId: Types.ObjectId;
  date: Date;
  startAt: Date;
  endAt: Date;
  status: AssignmentStatus;
  source: AssignmentSource;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AssignmentDocument = Document<Types.ObjectId, object, IAssignment> & IAssignment;

const AssignmentSchema = new Schema<IAssignment>(
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
    rosterId: {
      type: Schema.Types.ObjectId,
      ref: 'Roster',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shiftTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'ShiftType',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ASSIGNED', 'COMPLETED', 'CANCELLED', 'ABSENT'],
      default: 'ASSIGNED',
      index: true,
    },
    source: {
      type: String,
      enum: ['MANUAL', 'SWAP', 'ADMIN_OVERRIDE', 'AUTO_FILL'],
      default: 'MANUAL',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

AssignmentSchema.index({ organizationId: 1, employeeId: 1, startAt: 1 });
AssignmentSchema.index({ teamId: 1, startAt: 1 });
AssignmentSchema.index({ rosterId: 1, employeeId: 1, date: 1 });

export const Assignment =
  mongoose.models.Assignment ||
  mongoose.model<IAssignment>('Assignment', AssignmentSchema);
