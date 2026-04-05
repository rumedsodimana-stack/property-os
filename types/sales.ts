// ─── Sales & Marketing Types ─────────────────────────────────────────────────

export type LeadStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'trade_show' | 'ota' | 'social_media' | 'walk_in' | 'rfi';
export type AccountTier = 'platinum' | 'gold' | 'silver' | 'bronze';
export type CampaignChannel = 'email' | 'social' | 'digital' | 'print' | 'event' | 'seo';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
export type RevenueSegment = 'transient' | 'corporate' | 'group' | 'leisure' | 'government' | 'wholesale' | 'ota';

export interface SalesLead {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  stage: LeadStage;
  source: LeadSource;
  estimatedValue: number;
  estimatedRoomNights: number;
  probability: number;           // 0-100
  assignedTo: string;
  nextFollowUp?: string;         // ISO date
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  lostReason?: string;
}

export interface CorporateAccount {
  id: string;
  companyName: string;
  tier: AccountTier;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  negotiatedRate: number;
  rateCode: string;
  contractStart: string;
  contractEnd: string;
  roomNightsTarget: number;
  roomNightsActual: number;
  revenueTarget: number;
  revenueActual: number;
  lastBookingDate?: string;
  accountManager: string;
  notes?: string;
  active: boolean;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  targetSegment: RevenueSegment;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueTarget {
  id: string;
  month: string;                 // YYYY-MM
  segment: RevenueSegment;
  targetRevenue: number;
  actualRevenue: number;
  targetRoomNights: number;
  actualRoomNights: number;
  targetADR: number;
  actualADR: number;
  forecastRevenue: number;
  notes?: string;
}

export interface CompetitorProperty {
  id: string;
  name: string;
  starRating: number;
  roomCount: number;
  avgRate: number;
  occupancy: number;             // 0-100
  revpar: number;
  strengths?: string[];
  weaknesses?: string[];
  lastUpdated: string;
}

export interface MarketingCollateral {
  id: string;
  name: string;
  type: 'brochure' | 'flyer' | 'rate_sheet' | 'presentation' | 'photo' | 'video' | 'template';
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  tags?: string[];
  version: number;
}
