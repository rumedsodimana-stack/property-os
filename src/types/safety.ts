// ─── Health & Safety Types ───────────────────────────────────────────────────
// Hotel Singularity OS — H&S Department

export type IncidentSeverity = 'near_miss' | 'minor' | 'moderate' | 'major' | 'critical';
export type IncidentStatus = 'reported' | 'investigating' | 'action_required' | 'resolved' | 'closed';
export type IncidentCategory =
  | 'slip_trip_fall'
  | 'burn_scald'
  | 'cut_laceration'
  | 'chemical_exposure'
  | 'electrical'
  | 'fire'
  | 'food_safety'
  | 'ergonomic'
  | 'guest_injury'
  | 'workplace_violence'
  | 'other';

export type CertificateStatus = 'valid' | 'expiring_soon' | 'expired' | 'pending_renewal';
export type HACCPCheckType = 'temperature' | 'cleanliness' | 'pest_control' | 'storage' | 'cross_contamination' | 'personal_hygiene';
export type FireEquipmentType = 'extinguisher' | 'alarm_panel' | 'sprinkler' | 'smoke_detector' | 'fire_hose' | 'emergency_light' | 'exit_sign' | 'fire_door';
export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';
export type RiskAssessmentStatus = 'draft' | 'active' | 'under_review' | 'archived';

export interface SafetyIncident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  reportedBy: string;
  reportedAt: string;
  injuredParty?: {
    name: string;
    type: 'employee' | 'guest' | 'contractor' | 'visitor';
    injuryDescription?: string;
    treatmentGiven?: string;
    hospitalised: boolean;
  };
  witnesses: string[];
  immediateAction?: string;
  investigationNotes?: string;
  rootCause?: string;
  correctiveActions: string[];
  reportableToAuthority: boolean;
  authorityReference?: string;
  closedAt?: string;
  closedBy?: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceCert {
  id: string;
  name: string;
  issuingAuthority: string;
  certificateNumber: string;
  category: 'fire_safety' | 'food_hygiene' | 'occupational_health' | 'environmental' | 'building' | 'elevator' | 'pool' | 'general';
  issueDate: string;
  expiryDate: string;
  status: CertificateStatus;
  responsiblePerson: string;
  documentUrl?: string;
  renewalCost?: number;
  notes?: string;
}

export interface HACCPLog {
  id: string;
  checkType: HACCPCheckType;
  location: string;
  outlet: string;
  checkedBy: string;
  checkedAt: string;
  temperatureReading?: number;
  temperatureUnit?: 'C' | 'F';
  minThreshold?: number;
  maxThreshold?: number;
  inCompliance: boolean;
  correctiveAction?: string;
  notes?: string;
  equipmentId?: string;
}

export interface FireEquipment {
  id: string;
  type: FireEquipmentType;
  location: string;
  floor: string;
  zone: string;
  serialNumber?: string;
  installDate: string;
  lastInspection: string;
  nextInspection: string;
  status: 'operational' | 'needs_service' | 'out_of_service' | 'replaced';
  inspectedBy?: string;
  notes?: string;
}

export interface TrainingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  courseName: string;
  courseType: 'fire_safety' | 'first_aid' | 'food_hygiene' | 'manual_handling' | 'hazmat' | 'evacuation' | 'cpr' | 'general_safety';
  completedDate: string;
  expiryDate: string;
  certificateUrl?: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  provider: string;
  score?: number;
}

export interface RiskAssessment {
  id: string;
  title: string;
  area: string;
  department: string;
  assessedBy: string;
  assessedDate: string;
  reviewDate: string;
  status: RiskAssessmentStatus;
  hazards: {
    id: string;
    description: string;
    riskLevel: RiskLevel;
    likelihood: 1 | 2 | 3 | 4 | 5;
    impact: 1 | 2 | 3 | 4 | 5;
    riskScore: number;
    existingControls: string[];
    additionalControls: string[];
    responsiblePerson: string;
    targetDate: string;
    residualRisk: RiskLevel;
  }[];
  overallRisk: RiskLevel;
  approvedBy?: string;
  approvedDate?: string;
  notes?: string;
}
