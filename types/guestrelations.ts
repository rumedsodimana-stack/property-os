
// ────────────────────────────────────────────────────────────
// Guest Relations Types - Hotel Singularity OS
// ────────────────────────────────────────────────────────────

export type VIPCategory = 'VVIP' | 'VIP' | 'CIP' | 'SPATT' | 'Repeat' | 'Influencer';

export type ComplaintStatus = 'Open' | 'Acknowledged' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed';
export type ComplaintSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type ComplaintCategory = 'Room' | 'Service' | 'F&B' | 'Housekeeping' | 'Maintenance' | 'Billing' | 'Noise' | 'Other';

export type LoyaltyProgramTier = 'Classic' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
export type OccasionType = 'Birthday' | 'Anniversary' | 'Honeymoon' | 'Wedding' | 'Graduation' | 'Promotion' | 'Other';
export type FeedbackChannel = 'In-Person' | 'Email' | 'App' | 'Survey' | 'OTA Review' | 'Social Media' | 'Phone';

export interface VIPGuest {
  id: string;
  guestId: string;
  guestName: string;
  category: VIPCategory;
  roomNumber?: string;
  reservationId?: string;
  checkIn: string;
  checkOut: string;
  preferences: string[];
  allergies: string[];
  notes: string;
  amenitiesOrdered: { item: string; deliveredAt?: number; status: 'Pending' | 'Delivered' }[];
  assignedAgent: string;
  lastVisit?: number;
  totalStays: number;
  lifetimeSpend: number;
  photo?: string;
}

export interface GuestComplaint {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber?: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  subject: string;
  description: string;
  reportedAt: number;
  acknowledgedAt?: number;
  resolvedAt?: number;
  assignedTo: string;
  department: string;
  resolution?: string;
  compensationOffered?: string;
  followUpDate?: string;
  guestSatisfied?: boolean;
  attachments?: string[];
}

export interface LoyaltyMember {
  id: string;
  guestId: string;
  guestName: string;
  email: string;
  phone?: string;
  tier: LoyaltyProgramTier;
  pointsBalance: number;
  pointsEarnedYTD: number;
  pointsRedeemedYTD: number;
  enrollmentDate: string;
  tierExpiryDate: string;
  totalNightsYTD: number;
  totalNightsLifetime: number;
  totalSpendLifetime: number;
  preferredRoom?: string;
  preferredFloor?: number;
  dietaryPreferences?: string[];
  specialRequests?: string[];
  referralCode?: string;
  referralCount: number;
}

export interface SpecialOccasion {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber?: string;
  occasionType: OccasionType;
  date: string;
  details: string;
  amenitiesPlanned: { item: string; cost: number; status: 'Planned' | 'Ordered' | 'Delivered' }[];
  budget: number;
  approvedBy?: string;
  assignedTo: string;
  status: 'Planning' | 'Approved' | 'In Progress' | 'Completed' | 'Cancelled';
  guestNotified: boolean;
  notes?: string;
}

export interface GuestFeedback {
  id: string;
  guestId: string;
  guestName: string;
  reservationId?: string;
  channel: FeedbackChannel;
  dateReceived: number;
  overallRating: number; // 1-5
  categories: {
    cleanliness?: number;
    service?: number;
    food?: number;
    facilities?: number;
    valueForMoney?: number;
    location?: number;
  };
  comment: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  responded: boolean;
  responseText?: string;
  respondedBy?: string;
  respondedAt?: number;
  actionRequired: boolean;
  actionTaken?: string;
  tags?: string[];
}
