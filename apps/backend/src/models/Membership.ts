import mongoose, { Document, Schema, Types } from 'mongoose';

export type MembershipRole = 'ADMIN' | 'SUPERVISOR' | 'MEMBER';
export type ScopedRole =
  | 'STAFF'
  | 'SUPERVISOR'
  | 'TEAM_ADMIN'
  | 'FACILITY_ADMIN'
  | 'ORG_ADMIN';

export type MembershipStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'INVITED'
  | 'REJECTED'
  | 'SUSPENDED';

export interface IMembership {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  facilityId?: Types.ObjectId;
  teamId?: Types.ObjectId;
  role: MembershipRole;
  roles: ScopedRole[];
  status: MembershipStatus;
  joinedAt: Date;
  invitedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type MembershipDocument = Document<Types.ObjectId, object, IMembership> & IMembership;

const MembershipSchema = new Schema<IMembership>(
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
    role: {
      type: String,
      enum: ['ADMIN', 'SUPERVISOR', 'MEMBER'],
      default: 'MEMBER',
    },
    roles: {
      type: [String],
      enum: ['STAFF', 'SUPERVISOR', 'TEAM_ADMIN', 'FACILITY_ADMIN', 'ORG_ADMIN'],
      default: ['STAFF'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING', 'INVITED', 'REJECTED', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

MembershipSchema.index({ userId: 1, organizationId: 1, teamId: 1 }, { unique: true });
MembershipSchema.index({ organizationId: 1, teamId: 1, status: 1 });
MembershipSchema.index({ userId: 1, status: 1 });

export const Membership =
  mongoose.models.Membership ||
  mongoose.model<IMembership>('Membership', MembershipSchema);
