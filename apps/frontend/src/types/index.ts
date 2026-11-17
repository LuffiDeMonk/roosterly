export type UserRole =
  | 'PLATFORM_ADMIN'
  | 'ORG_ADMIN'
  | 'FACILITY_ADMIN'
  | 'SUPERVISOR'
  | 'STAFF'
  | 'DOCTOR'
  | 'NURSE';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'INVITED';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  status: UserStatus;
  phone?: string;
  avatarUrl?: string;
  department?: string;
  jobTitle?: string;
}

export interface Organization {
  _id: string;
  name: string;
  code: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  timezone?: string;
}

export interface Team {
  _id: string;
  orgId: string;
  name: string;
  code: string;
  description?: string;
  department?: string;
  tier: 'FREE' | 'PRO';
  maxMembers: number;
  activeMemberCount?: number;
  requireSupervisorApproval: boolean;
}

export type MembershipRole = 'ADMIN' | 'SUPERVISOR' | 'MEMBER';
export type MembershipStatus = 'ACTIVE' | 'PENDING' | 'INVITED' | 'REJECTED' | 'SUSPENDED';

export interface Membership {
  _id: string;
  userId: string;
  orgId: string;
  teamId: string;
  teamName?: string;
  teamCode?: string;
  role: MembershipRole;
  status: MembershipStatus;
  user?: Partial<User>;
}

export interface ShiftType {
  _id: string;
  teamId: string;
  name: string;
  shortCode: string;
  startTime: string; // "07:00"
  endTime: string;   // "15:30"
  durationMinutes: number;
  isOvernight: boolean;
  colorBg: string;   // hex or tailwind class
  colorText: string;
  description?: string;
}

export type AssignmentStatus = 'ASSIGNED' | 'COMPLETED' | 'CANCELLED' | 'ABSENT';

export interface Assignment {
  _id: string;
  rosterId: string;
  teamId: string;
  employeeId: string | { _id: string; firstName: string; lastName: string; email: string };
  shiftTypeId: string | ShiftType;
  date: string; // ISO date YYYY-MM-DD
  startTime: string;
  endTime: string;
  status: AssignmentStatus;
  notes?: string;
}

export type RosterStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Roster {
  _id: string;
  teamId: string;
  startDate: string; // Monday YYYY-MM-DD
  endDate: string;   // Sunday YYYY-MM-DD
  status: RosterStatus;
  version: number;
  assignments: Assignment[];
}

export type SwapType = 'DIRECT' | 'BROADCAST';
export type SwapStatus =
  | 'OPEN'
  | 'ACCEPTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'DECLINED'
  | 'WITHDRAWN'
  | 'CANCELLED'
  | 'EXPIRED';

export interface SwapRequest {
  _id: string;
  teamId: string;
  requesterId: string | Partial<User>;
  targetEmployeeId?: string | Partial<User>;
  requesterAssignmentId: string | Partial<Assignment>;
  targetAssignmentId?: string | Partial<Assignment>;
  type: SwapType;
  status: SwapStatus;
  reason?: string;
  reviewedBy?: string | Partial<User>;
  reviewedAt?: string;
  reviewerNotes?: string;
  createdAt: string;
}

export interface CoverageSlot {
  shiftTypeId: string;
  shiftName: string;
  shortCode: string;
  colorBg: string;
  colorText: string;
  assignedCount: number;
  targetCount: number;
  isUnderstaffed: boolean;
}

export interface DayCoverage {
  date: string; // YYYY-MM-DD
  slots: CoverageSlot[];
}
