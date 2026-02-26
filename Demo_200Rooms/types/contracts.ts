export type IntegrationStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface IntegrationEvent {
  id: string;
  provider: string;
  entityType: 'reservation' | 'availability' | 'rate' | 'payment' | 'connection' | 'sync';
  entityId: string;
  action: string;
  status: IntegrationStatus;
  latencyMs?: number;
  errorCode?: string;
  occurredAt: number;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface OtaConnectionV2 {
  id: string;
  providerId: string;
  providerName: string;
  icon?: string;
  status: 'Connected' | 'Disconnected' | 'Syncing';
  mode: 'sandbox' | 'production';
  apiKeyMasked: string;
  connectedAt: number;
  lastSync?: number;
  updatedAt?: number;
}

export interface SyncJob {
  id: string;
  provider: string;
  entityType: 'availability' | 'rates' | 'reservation' | 'all';
  entityId?: string;
  payload?: Record<string, unknown>;
  status: IntegrationStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  updatedAt: number;
  lastError?: string;
}

export interface SyncFailure {
  id: string;
  provider: string;
  syncJobId: string;
  errorCode: string;
  errorMessage: string;
  payload?: Record<string, unknown>;
  createdAt: number;
  replayedAt?: number;
  replayStatus?: 'pending' | 'success' | 'failed';
}

export interface BookingIntent {
  id: string;
  guestId: string;
  reservationId?: string;
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  holdExpiresAt: number;
  totalAmount: number;
  currency: string;
  createdAt: number;
  updatedAt: number;
}

export interface PaymentIntentRecord {
  id: string;
  bookingIntentId?: string;
  reservationId?: string;
  amount: number;
  currency: string;
  status: 'requires_capture' | 'captured' | 'voided' | 'refunded';
  provider: 'stripe' | 'sandbox';
  providerReference: string;
  idempotencyKey: string;
  createdAt: number;
  updatedAt: number;
}

export interface PaymentEvent {
  id: string;
  paymentIntentId: string;
  action: 'created' | 'captured' | 'voided' | 'refunded';
  amount: number;
  currency: string;
  occurredAt: number;
  by: string;
  metadata?: Record<string, unknown>;
}

export interface RefundEvent {
  id: string;
  paymentIntentId: string;
  amount: number;
  reason?: string;
  occurredAt: number;
  by: string;
}

export interface AuthSessionRecord {
  id: string;
  userId: string;
  role: string;
  issuedAt: number;
  expiresAt: number;
  tokenHash: string;
  source: 'operator' | 'guest';
  revoked?: boolean;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  occurredAt: number;
  metadata?: Record<string, unknown>;
}
