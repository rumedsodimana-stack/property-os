
// ============================================================================
// Loss Prevention Types
// Hotel Singularity OS - Security & Asset Protection Domain
// ============================================================================

export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentCategory =
  | 'Theft'
  | 'Fraud'
  | 'Vandalism'
  | 'Trespassing'
  | 'Safety Hazard'
  | 'Employee Misconduct'
  | 'Guest Dispute'
  | 'Property Damage'
  | 'Suspicious Activity'
  | 'Access Violation';

export type IncidentStatus = 'Open' | 'Under Investigation' | 'Resolved' | 'Escalated' | 'Closed';

export interface SecurityIncident {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  floor: string;
  reportedBy: string;
  reportedAt: number;
  assignedTo: string;
  assignedToName: string;
  estimatedLoss: number;
  actualLoss: number;
  witnesses: string[];
  evidenceIds: string[];
  relatedIncidentIds: string[];
  resolution: string;
  resolvedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export type InvestigationStatus = 'Initiated' | 'Evidence Collection' | 'Interviews' | 'Analysis' | 'Report Pending' | 'Closed';
export type InvestigationPriority = 'Routine' | 'Elevated' | 'Urgent' | 'Emergency';

export interface Investigation {
  id: string;
  caseNumber: string;
  incidentId: string;
  title: string;
  description: string;
  status: InvestigationStatus;
  priority: InvestigationPriority;
  leadInvestigator: string;
  leadInvestigatorName: string;
  teamMembers: string[];
  startedAt: number;
  targetCloseDate: number;
  closedAt: number | null;
  findings: string;
  recommendations: string;
  evidenceCollected: EvidenceItem[];
  interviewsConducted: InterviewRecord[];
  totalLossAmount: number;
  recoveredAmount: number;
}

export interface EvidenceItem {
  id: string;
  type: 'CCTV Footage' | 'Photo' | 'Document' | 'Statement' | 'Physical' | 'Digital';
  description: string;
  collectedBy: string;
  collectedAt: number;
  storageLocation: string;
  chainOfCustody: string[];
}

export interface InterviewRecord {
  id: string;
  intervieweeId: string;
  intervieweeName: string;
  interviewerName: string;
  conductedAt: number;
  summary: string;
  isWitness: boolean;
}

export type CameraStatus = 'Online' | 'Offline' | 'Maintenance' | 'Recording' | 'Motion Detected';
export type CameraType = 'PTZ' | 'Fixed' | 'Dome' | 'Bullet' | 'Thermal';

export interface CCTVCamera {
  id: string;
  cameraId: string;
  name: string;
  location: string;
  floor: string;
  zone: string;
  type: CameraType;
  status: CameraStatus;
  resolution: string;
  isRecording: boolean;
  lastMotionDetected: number | null;
  storageRetentionDays: number;
  ipAddress: string;
  installedAt: number;
  lastMaintenanceAt: number;
}

export type AccessEventType = 'Entry' | 'Exit' | 'Denied' | 'Tailgating' | 'Forced Entry' | 'Propped Open';
export type AccessZone = 'Public' | 'Staff Only' | 'Restricted' | 'Executive' | 'Server Room' | 'Cash Office' | 'Loading Dock';

export interface AccessLog {
  id: string;
  timestamp: number;
  eventType: AccessEventType;
  personId: string;
  personName: string;
  personType: 'Employee' | 'Guest' | 'Visitor' | 'Contractor';
  accessPoint: string;
  zone: AccessZone;
  floor: string;
  cardNumber: string;
  granted: boolean;
  reason: string;
  flagged: boolean;
}

export type AssetCategory = 'Electronics' | 'Furniture' | 'Linen' | 'Minibar' | 'Silverware' | 'Art' | 'Equipment' | 'Cash' | 'Inventory';
export type AssetAlertType = 'Missing' | 'Damaged' | 'Relocated' | 'Counted' | 'Discrepancy' | 'Recovered';

export interface AssetRecord {
  id: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  location: string;
  floor: string;
  value: number;
  lastAuditDate: number;
  lastAuditedBy: string;
  alertType: AssetAlertType | null;
  alertNote: string;
  status: 'In Place' | 'Missing' | 'Damaged' | 'Under Review' | 'Written Off';
  purchaseDate: number;
  department: string;
}

export interface DailyLPReport {
  date: number;
  shiftsCompleted: number;
  incidentsReported: number;
  investigationsActive: number;
  camerasOnline: number;
  camerasOffline: number;
  accessDenials: number;
  flaggedEvents: number;
  assetAlertsOpen: number;
  estimatedLossToday: number;
  recoveredToday: number;
  patrolsCompleted: number;
  notes: string;
}
