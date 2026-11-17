import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IShiftType {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  facilityId?: Types.ObjectId;
  teamId?: Types.ObjectId;
  name: string;
  shortCode: string;
  startTime: string; // HH:mm (24-hour format)
  endTime: string;   // HH:mm (24-hour format)
  durationHours: number;
  isOvernight: boolean;
  colorBg: string;   // Hex color or Tailwind token e.g. #E0F2FE
  colorText: string; // Hex color or Tailwind token e.g. #0369A1
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ShiftTypeDocument = Document<Types.ObjectId, object, IShiftType> & IShiftType;

const ShiftTypeSchema = new Schema<IShiftType>(
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
      required: false,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    durationHours: {
      type: Number,
      required: true,
      min: 0.5,
      max: 24,
    },
    isOvernight: {
      type: Boolean,
      default: false,
    },
    colorBg: {
      type: String,
      required: true,
      default: '#E0F2FE',
    },
    colorText: {
      type: String,
      required: true,
      default: '#0369A1',
    },
    description: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ShiftTypeSchema.index({ organizationId: 1, teamId: 1, shortCode: 1 });
ShiftTypeSchema.index({ organizationId: 1, active: 1 });

export const ShiftType =
  mongoose.models.ShiftType || mongoose.model<IShiftType>('ShiftType', ShiftTypeSchema);
