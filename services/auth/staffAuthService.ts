/**
 * Hotel Singularity OS — Staff Auth Service (Frontend)
 *
 * Handles:
 *  - Requesting staff access (new employee sign-up flow)
 *  - Approving / rejecting access requests (Manager, HR, GM workflow)
 *  - Fetching pending approval queue
 *  - Multi-hotel access list for cluster hotel switcher
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../kernel/firebase';
import type { OSRole } from '../kernel/internalAuthService';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ApprovalStage =
  | 'pending_manager'
  | 'pending_hr'
  | 'pending_gm'
  | 'approved'
  | 'rejected';

export interface StaffAccessRequest {
  id: string;
  fullName: string;
  email: string;
  employeeId: string;
  requestedRole: OSRole;
  department: string;
  phone?: string;
  approvalStage: ApprovalStage;
  hotelId: string;
  // approval trail
  managerApprovedAt?: string;
  managerApprovedBy?: string;
  hrApprovedAt?: string;
  hrApprovedBy?: string;
  gmApprovedAt?: string;
  gmApprovedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestAccessPayload {
  hotelId: string;
  fullName: string;
  email: string;
  employeeId: string;
  requestedRole: OSRole;
  department: string;
  phone?: string;
  /** PIN (4–6 digits) the staff member wants to use for login */
  pin: string;
}

export interface ApproveRequestPayload {
  hotelId: string;
  requestId: string;
  /** Optional comment from the approver */
  comment?: string;
}

export interface RejectRequestPayload {
  hotelId: string;
  requestId: string;
  reason: string;
}

export interface AccessibleHotel {
  hotelId: string;
  hotelName: string;
  role: OSRole;
  domain: string;
  country: string;
  planId: string;
}

// ─── Callable wrappers ────────────────────────────────────────────────────────

const _requestStaffAccess   = httpsCallable<RequestAccessPayload, { requestId: string; message: string }>(functions, 'requestStaffAccess');
const _approveStaffRequest  = httpsCallable<ApproveRequestPayload, { stage: ApprovalStage; message: string; activated?: boolean }>(functions, 'approveStaffRequest');
const _rejectStaffRequest   = httpsCallable<RejectRequestPayload,  { message: string }>(functions, 'rejectStaffRequest');
const _getPendingRequests   = httpsCallable<{ hotelId: string }, { requests: StaffAccessRequest[] }>(functions, 'getPendingRequests');
const _getAccessibleHotels  = httpsCallable<{ uid: string }, { hotels: AccessibleHotel[] }>(functions, 'getAccessibleHotels');

/** Submit a new staff access request (called from StaffRegistrationModal). */
export async function requestStaffAccess(payload: RequestAccessPayload): Promise<{ requestId: string; message: string }> {
  const result = await _requestStaffAccess(payload);
  return result.data;
}

/** Approve the next stage of a staff request (Manager → HR → GM). */
export async function approveStaffRequest(payload: ApproveRequestPayload): Promise<{ stage: ApprovalStage; message: string; activated?: boolean }> {
  const result = await _approveStaffRequest(payload);
  return result.data;
}

/** Reject a staff access request at any stage. */
export async function rejectStaffRequest(payload: RejectRequestPayload): Promise<void> {
  await _rejectStaffRequest(payload);
}

/** Fetch all requests visible to the caller's role for a given hotel. */
export async function getPendingRequests(hotelId: string): Promise<StaffAccessRequest[]> {
  const result = await _getPendingRequests({ hotelId });
  return result.data.requests;
}

/** Fetch all hotels this uid has access to (for cluster switcher). */
export async function getAccessibleHotels(uid: string): Promise<AccessibleHotel[]> {
  const result = await _getAccessibleHotels({ uid });
  return result.data.hotels;
}

// ─── Static lookups ───────────────────────────────────────────────────────────

export const REQUESTABLE_ROLES: Array<{ value: OSRole; label: string; description: string }> = [
  { value: 'FrontDesk',  label: 'Front Desk Agent',    description: 'Reservations, check-in/out, guest services' },
  { value: 'Supervisor', label: 'Supervisor',           description: 'Shift oversight, housekeeping, maintenance' },
  { value: 'Manager',    label: 'Manager',              description: 'Department head with approval authority' },
  { value: 'Finance',    label: 'Finance / Accounting', description: 'Financial reports, billing, auditing' },
  { value: 'Chef',       label: 'Chef / F&B Staff',     description: 'Point of Sale, kitchen operations' },
  { value: 'Staff',      label: 'General Staff',        description: 'Basic access — housekeeping, room service' },
];

export const DEPARTMENTS = [
  'Front Office',
  'Housekeeping',
  'Food & Beverage',
  'Finance & Accounting',
  'Human Resources',
  'Engineering & Maintenance',
  'Security',
  'Sales & Marketing',
  'IT & Systems',
  'Recreation & Wellness',
  'Procurement',
  'General Management',
];

/** Which approval stage a given role acts on */
export const ROLE_ACTS_ON_STAGE: Partial<Record<OSRole, ApprovalStage>> = {
  Manager: 'pending_manager',
  GM:      'pending_hr',       // GM can also act as HR if no HR role exists
  // NOTE: 'pending_gm' is always actioned by GM only
};

/** Human-readable labels for each stage */
export const STAGE_LABELS: Record<ApprovalStage, string> = {
  pending_manager: 'Awaiting Manager',
  pending_hr:      'Awaiting HR',
  pending_gm:      'Awaiting GM',
  approved:        'Approved',
  rejected:        'Rejected',
};

export const STAGE_COLORS: Record<ApprovalStage, string> = {
  pending_manager: 'bg-amber-100 text-amber-700',
  pending_hr:      'bg-blue-100 text-blue-700',
  pending_gm:      'bg-violet-100 text-violet-700',
  approved:        'bg-emerald-100 text-emerald-700',
  rejected:        'bg-rose-100 text-rose-700',
};
