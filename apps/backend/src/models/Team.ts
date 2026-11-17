import mongoose, { Document, Schema, Types } from 'mongoose';

export type TeamStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type TeamTier = 'FREE' | 'PRO';

export interface ITeamSettings {
  defaultShiftDurationHours: number;
  requireSupervisorApproval: boolean;
}

export interface ITeam {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  facilityId?: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  tier: TeamTier;
  maxMembers: number;
  status: TeamStatus;
  settings: ITeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type TeamDocument = Document<Types.ObjectId, object, ITeam> & ITeam;

const TeamSchema = new Schema<ITeam>(
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
    description: {
      type: String,
      trim: true,
    },
    tier: {
      type: String,
      enum: ['FREE', 'PRO'],
      default: 'FREE',
    },
    maxMembers: {
      type: Number,
      default: 5,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    settings: {
      defaultShiftDurationHours: {
        type: Number,
        default: 8,
      },
      requireSupervisorApproval: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

TeamSchema.index({ organizationId: 1, name: 1 });

export const Team = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
