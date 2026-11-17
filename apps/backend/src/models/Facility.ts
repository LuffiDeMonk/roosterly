import mongoose, { Document, Schema, Types } from 'mongoose';

export type FacilityStatus = 'ACTIVE' | 'INACTIVE';

export interface IFacility {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  code?: string;
  timezone: string;
  address?: string;
  status: FacilityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type FacilityDocument = Document<Types.ObjectId, object, IFacility> & IFacility;

const FacilitySchema = new Schema<IFacility>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      uppercase: true,
      trim: true,
    },
    timezone: {
      type: String,
      required: true,
      default: 'UTC',
    },
    address: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

FacilitySchema.index({ organizationId: 1, name: 1 });

export const Facility =
  mongoose.models.Facility || mongoose.model<IFacility>('Facility', FacilitySchema);
