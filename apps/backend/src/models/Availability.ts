import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAvailability {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  employeeId: Types.ObjectId;
  unavailableDates: Date[];
  preferredWorkingDays: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  avoidWorkingDays: number[];     // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  preferredShiftTypeIds: Types.ObjectId[];
  avoidShiftTypeIds: Types.ObjectId[];
  maxHoursPerWeek?: number;
  notes?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AvailabilityDocument = Document<Types.ObjectId, object, IAvailability> &
  IAvailability;

const AvailabilitySchema = new Schema<IAvailability>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    unavailableDates: {
      type: [Date],
      default: [],
    },
    preferredWorkingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5], // Monday through Friday by default
    },
    avoidWorkingDays: {
      type: [Number],
      default: [],
    },
    preferredShiftTypeIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ShiftType',
      },
    ],
    avoidShiftTypeIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ShiftType',
      },
    ],
    maxHoursPerWeek: {
      type: Number,
      min: 1,
      max: 80,
    },
    notes: {
      type: String,
      trim: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

AvailabilitySchema.index({ organizationId: 1, employeeId: 1 }, { unique: true });

export const Availability =
  mongoose.models.Availability ||
  mongoose.model<IAvailability>('Availability', AvailabilitySchema);
