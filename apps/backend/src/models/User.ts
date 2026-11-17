import mongoose, { Document, Schema, Types } from 'mongoose';

export type UserRole =
  | 'PLATFORM_ADMIN'
  | 'ORG_ADMIN'
  | 'FACILITY_ADMIN'
  | 'SUPERVISOR'
  | 'STAFF'
  | 'DOCTOR'
  | 'NURSE';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'INVITED';

export interface IUserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    inApp: boolean;
    push: boolean;
  };
}

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  avatar?: string;
  status: UserStatus;
  roles: UserRole[];
  isEmailVerified: boolean;
  googleId?: string;
  preferences: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = Document<Types.ObjectId, object, IUser> & IUser;

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: false,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'INVITED'],
      default: 'ACTIVE',
      index: true,
    },
    roles: {
      type: [String],
      enum: [
        'PLATFORM_ADMIN',
        'ORG_ADMIN',
        'FACILITY_ADMIN',
        'SUPERVISOR',
        'STAFF',
        'DOCTOR',
        'NURSE',
      ],
      default: ['STAFF'],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      notifications: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
