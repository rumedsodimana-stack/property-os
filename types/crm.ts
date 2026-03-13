export type Channel = 'email' | 'sms' | 'whatsapp' | 'push';

export interface Consent {
  channel: Channel;
  status: 'opt_in' | 'opt_out';
  updatedAt: string;
  source?: string;
}

export interface GuestProfile {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  loyaltyTier?: string;
  preferences?: Record<string, any>;
  totalSpend?: number;
  lastStay?: string;
  consents?: Consent[];
  mergedIntoId?: string; // for dedup
  createdAt: string;
  updatedAt: string;
}

export interface CompanyAccount {
  id: string;
  name: string;
  domain?: string;
  contactIds?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  companyId?: string;
  role?: string;
  consents?: Consent[];
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  profileId: string;
  channel: Channel | 'in_person';
  type: 'message' | 'call' | 'note' | 'stay' | 'pos' | 'recreation' | 'system';
  subject?: string;
  body?: string;
  timestamp: string;
  actor?: string;
  tags?: string[];
}

export interface SegmentRule {
  field: string;
  op: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: string | number | boolean;
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  rules: SegmentRule[];
  estimatedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  segmentId: string;
  channel: Channel;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  sendAt?: string;
  templateId?: string;
  sentCount?: number;
  failCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CrmTask {
  id: string;
  profileId?: string;
  contactId?: string;
  dueAt: string;
  title: string;
  status: 'open' | 'done' | 'cancelled';
  owner?: string;
  notes?: string;
  source?: 'CRM' | 'PMS' | 'POS' | 'Connect';
}
