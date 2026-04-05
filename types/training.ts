
// ============================================================================
// Training Academy Types
// Hotel Singularity OS - Learning & Development Domain
// ============================================================================

export type CourseCategory =
  | 'Onboarding'
  | 'Compliance'
  | 'Service Excellence'
  | 'Technical Skills'
  | 'Leadership'
  | 'Safety & Security'
  | 'F&B Operations'
  | 'Housekeeping Standards'
  | 'Revenue Management'
  | 'Brand Standards';

export type CourseFormat = 'Classroom' | 'E-Learning' | 'Blended' | 'On-the-Job' | 'Workshop' | 'Simulation';
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type CourseStatus = 'Draft' | 'Published' | 'Archived' | 'Under Review';

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  category: CourseCategory;
  format: CourseFormat;
  level: CourseLevel;
  status: CourseStatus;
  durationMinutes: number;
  maxParticipants: number;
  prerequisites: string[];
  instructorId: string;
  instructorName: string;
  department: string;
  isMandatory: boolean;
  recertificationMonths: number | null;
  passingScore: number;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export type SessionStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Postponed';

export interface TrainingSession {
  id: string;
  courseId: string;
  courseTitle: string;
  instructorId: string;
  instructorName: string;
  location: string;
  scheduledDate: number;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  enrolledCount: number;
  maxCapacity: number;
  attendees: SessionAttendee[];
  notes: string;
}

export interface SessionAttendee {
  employeeId: string;
  employeeName: string;
  department: string;
  attended: boolean;
  score: number | null;
  passed: boolean | null;
  feedback: string;
}

export type CertificationStatus = 'Active' | 'Expired' | 'Pending Renewal' | 'Revoked';

export interface Certification {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  courseId: string;
  courseTitle: string;
  certificationName: string;
  issuedDate: number;
  expiryDate: number | null;
  status: CertificationStatus;
  score: number;
  certificateNumber: string;
  issuedBy: string;
}

export type ContentType = 'Video' | 'Document' | 'Quiz' | 'Interactive' | 'Presentation' | 'Checklist' | 'Assessment';

export interface LMSContent {
  id: string;
  courseId: string;
  title: string;
  type: ContentType;
  url: string;
  durationMinutes: number;
  orderIndex: number;
  isRequired: boolean;
  description: string;
  uploadedBy: string;
  uploadedAt: number;
  fileSize: string;
  completionRate: number;
}

export interface EmployeeProgress {
  employeeId: string;
  employeeName: string;
  department: string;
  role: string;
  coursesCompleted: number;
  coursesInProgress: number;
  coursesOverdue: number;
  totalScore: number;
  activeCertifications: number;
  expiringSoon: number;
  lastActivityDate: number;
  hoursCompleted: number;
}

export interface TrainingReport {
  totalCourses: number;
  totalSessions: number;
  totalEnrollments: number;
  completionRate: number;
  averageScore: number;
  activeCertifications: number;
  expiringCertifications: number;
  departmentBreakdown: { department: string; completionRate: number; avgScore: number }[];
  monthlyTrend: { month: string; completions: number; enrollments: number }[];
}
