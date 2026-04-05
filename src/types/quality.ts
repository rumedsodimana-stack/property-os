// ─── Quality Assurance Types ─────────────────────────────────────────────────
// Hotel Singularity OS — QA Department

export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type InspectionCategory = 'room' | 'public_area' | 'kitchen' | 'restaurant' | 'pool' | 'spa' | 'back_of_house' | 'exterior';
export type SeverityLevel = 'critical' | 'major' | 'minor' | 'observation';
export type CorrectiveActionStatus = 'open' | 'in_progress' | 'pending_review' | 'resolved' | 'escalated';
export type ChecklistItemStatus = 'pass' | 'fail' | 'na' | 'pending';
export type MysteryShopperStatus = 'scheduled' | 'in_progress' | 'report_pending' | 'completed';

export interface InspectionItem {
  id: string;
  label: string;
  status: ChecklistItemStatus;
  notes?: string;
  photoUrl?: string;
  severity?: SeverityLevel;
}

export interface Inspection {
  id: string;
  title: string;
  category: InspectionCategory;
  status: InspectionStatus;
  scheduledDate: string;
  completedDate?: string;
  inspectorId: string;
  inspectorName: string;
  location: string;
  score?: number;
  maxScore: number;
  items: InspectionItem[];
  findings: string[];
  correctiveActionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  category: InspectionCategory;
  version: string;
  items: { id: string; label: string; weight: number; mandatory: boolean }[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  departmentOwner: string;
  lastRevised: string;
  active: boolean;
}

export interface Checklist {
  id: string;
  templateId: string;
  templateName: string;
  assigneeId: string;
  assigneeName: string;
  scheduledDate: string;
  completedDate?: string;
  status: InspectionStatus;
  items: InspectionItem[];
  overallScore?: number;
  notes?: string;
}

export interface MysteryShopperVisit {
  id: string;
  agencyName: string;
  shopperAlias: string;
  visitDate: string;
  checkInDate?: string;
  checkOutDate?: string;
  status: MysteryShopperStatus;
  overallScore: number;
  maxScore: number;
  categories: {
    name: string;
    score: number;
    maxScore: number;
    highlights: string[];
    deficiencies: string[];
  }[];
  executiveSummary?: string;
  reportUrl?: string;
  correctiveActionIds: string[];
}

export interface GuestSatisfactionEntry {
  id: string;
  source: 'survey' | 'tripadvisor' | 'google' | 'booking' | 'internal' | 'social_media';
  guestName?: string;
  reservationId?: string;
  date: string;
  overallRating: number;
  maxRating: number;
  categories: { name: string; rating: number; maxRating: number }[];
  comment?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  responseStatus: 'pending' | 'responded' | 'no_action';
  respondedBy?: string;
  responseText?: string;
}

export interface CorrectiveAction {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  status: CorrectiveActionStatus;
  sourceType: 'inspection' | 'mystery_shopper' | 'guest_feedback' | 'internal_audit' | 'brand_audit';
  sourceId: string;
  department: string;
  assigneeId: string;
  assigneeName: string;
  dueDate: string;
  completedDate?: string;
  rootCause?: string;
  actionTaken?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityStandard {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  complianceLevel: 'mandatory' | 'recommended' | 'aspirational';
  lastAuditDate?: string;
  lastAuditScore?: number;
  targetScore: number;
  owner: string;
  active: boolean;
}
