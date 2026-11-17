import mongoose, { Document, Schema, Types } from 'mongoose';

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
export type OrganizationTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface IOrganizationSettings {
  allowDirectSwaps: boolean;
  allowOpenSwaps: boolean;
  requireSupervisorApprovalForSwaps: boolean;
  maxConsecutiveWorkingDays: number;
  minRestHoursBetweenShifts: number;
  shiftStaffingRatios?: {
    morning?: number;
    evening?: number;
    night?: number;
  };
}

export interface IOrganizationContact {
  email?: string;
  phone?: string;
  address?: string;
}

export interface IOrganization {
  _id: Types.ObjectId;
  name: string;
  code: string;
  logo?: string;
  status: OrganizationStatus;
  timezone: string;
  tier: OrganizationTier;
  contact?: IOrganizationContact;
  settings: IOrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type OrganizationDocument = Document<Types.ObjectId, object, IOrganization> & IOrganization;

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    logo: {
      type: String,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'TRIAL'],
      default: 'ACTIVE',
      index: true,
    },
    timezone: {
      type: String,
      required: true,
      default: 'UTC',
    },
    tier: {
      type: String,
      enum: ['FREE', 'PRO', 'ENTERPRISE'],
      default: 'FREE',
    },
    contact: {
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    settings: {
      allowDirectSwaps: { type: Boolean, default: true },
      allowOpenSwaps: { type: Boolean, default: true },
      requireSupervisorApprovalForSwaps: { type: Boolean, default: true },
      maxConsecutiveWorkingDays: { type: Number, default: 7 },
      minRestHoursBetweenShifts: { type: Number, default: 11 },
      shiftStaffingRatios: {
        morning: { type: Number, default: 2 },
        evening: { type: Number, default: 2 },
        night: { type: Number, default: 1 },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Organization =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>('Organization', OrganizationSchema);
