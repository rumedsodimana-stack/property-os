import { tenantService } from '../kernel/tenantService';
import { fetchItems, addItem } from '../kernel/firestoreService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../kernel/firebase';
import { limit as qLimit, orderBy } from 'firebase/firestore';

export interface ReviewRecord {
  id?: string;
  source: 'google' | 'tripadvisor' | 'booking_com' | 'expedia' | 'ota';
  reviewerName?: string;
  rating: number;
  title?: string;
  body: string;
  stayDate?: string;
  createdAt: number;
  propertyId: string;
  reservationId?: string;
  responseDraft?: string;
  sentiment?: number;
}

export interface ReviewMetrics {
  total: number;
  averageRating: number;
  perSource: Record<string, { count: number; averageRating: number }>;
  velocity7d: number;
  velocityPrev7d: number;
}

const toMillis = (value: any): number => {
  if (!value) return Date.now();
  if (typeof value === 'number') return value;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value.seconds === 'number') return (value.seconds * 1000) + Math.round((value.nanoseconds || 0) / 1_000_000);
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : Date.now();
};

export const reviewService = {
  async listReviews(limit = 100): Promise<ReviewRecord[]> {
    const propertyId = tenantService.getActivePropertyId();
    const records = await fetchItems<ReviewRecord>(
      `properties/${propertyId}/reviews`,
      orderBy('createdAt', 'desc'),
      qLimit(limit)
    );
    return records.map((r) => ({ ...r, createdAt: toMillis((r as any).createdAt ?? Date.now()) }));
  },

  async ingestReview(input: Omit<ReviewRecord, 'id' | 'propertyId' | 'createdAt'>) {
    const propertyId = tenantService.getActivePropertyId();
    const createdAt = Date.now();
    const docRef = await addItem(`properties/${propertyId}/reviews`, { ...input, propertyId, createdAt });
    return { id: docRef.id };
  },

  async storeResponseDraft(reviewId: string, draft: string) {
    const propertyId = tenantService.getActivePropertyId();
    await addItem(`properties/${propertyId}/review_responses`, {
      reviewId,
      draft,
      createdAt: Date.now(),
      propertyId
    });
  },

  async generateResponseDraft(review: Pick<ReviewRecord, 'id' | 'source' | 'body' | 'rating' | 'reviewerName'>) {
    if (!review.id) throw new Error('reviewId required for draft');
    const propertyId = tenantService.getActivePropertyId();
    const callable = httpsCallable(functions, 'draftReviewResponse');
    const result = await callable({
      propertyId,
      reviewId: review.id,
      reviewBody: review.body,
      rating: review.rating,
      guestName: review.reviewerName
    });
    const draft = (result.data as any)?.draft || '';
    return draft;
  },

  async syncSources() {
    const propertyId = tenantService.getActivePropertyId();
    const callable = httpsCallable(functions, 'syncReviews');
    await callable({ propertyId });
  },

  computeMetrics(reviews: ReviewRecord[]): ReviewMetrics {
    const now = Date.now();
    const ms7d = 7 * 24 * 60 * 60 * 1000;
    const start7d = now - ms7d;
    const startPrev7d = start7d - ms7d;

    const perSource: Record<string, { count: number; ratingSum: number }> = {};
    let total = 0;
    let ratingSum = 0;
    let velocity7d = 0;
    let velocityPrev7d = 0;

    reviews.forEach((r) => {
      const created = toMillis((r as any).createdAt);
      total += 1;
      ratingSum += r.rating || 0;

      if (!perSource[r.source]) perSource[r.source] = { count: 0, ratingSum: 0 };
      perSource[r.source].count += 1;
      perSource[r.source].ratingSum += r.rating || 0;

      if (created >= start7d) velocity7d += 1;
      else if (created >= startPrev7d) velocityPrev7d += 1;
    });

    const perSourceNormalized = Object.fromEntries(Object.entries(perSource).map(([k, v]) => ([
      k,
      {
        count: v.count,
        averageRating: v.count ? v.ratingSum / v.count : 0
      }
    ])));

    return {
      total,
      averageRating: total ? ratingSum / total : 0,
      perSource: perSourceNormalized,
      velocity7d,
      velocityPrev7d
    };
  }
};
