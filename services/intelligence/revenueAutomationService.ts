import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../kernel/firebase';
import { tenantService } from '../kernel/tenantService';
import { fetchItems } from '../kernel/firestoreService';
import { limit as qLimit, orderBy, doc, setDoc } from 'firebase/firestore';
import { CompsetSnapshot, DemandEvent, RateRecommendation, RatePushLog } from '../../types';

export type RevenueChannel = 'booking_com' | 'expedia';

export const revenueAutomationService = {
  async syncCompset(targetDate?: string): Promise<CompsetSnapshot> {
    const propertyId = tenantService.getActivePropertyId();
    const callable = httpsCallable(functions, 'fetchCompsetRates');
    const res: any = await callable({ propertyId, targetDate });
    return res.data as CompsetSnapshot;
  },

  async syncDemandEvents(): Promise<{ count: number }> {
    const propertyId = tenantService.getActivePropertyId();
    const callable = httpsCallable(functions, 'syncDemandEvents');
    const res: any = await callable({ propertyId });
    return res.data as { count: number };
  },

  async publishRecommendedRates(horizon = 14, channels: RevenueChannel[] = ['booking_com', 'expedia']) {
    const propertyId = tenantService.getActivePropertyId();
    const callable = httpsCallable(functions, 'publishRecommendedRates');
    const res: any = await callable({ propertyId, horizon, channels });
    return res.data;
  },

  async latestCompset(): Promise<CompsetSnapshot | null> {
    const snaps = await fetchItems<CompsetSnapshot>('compset_snapshots', orderBy('capturedAt', 'desc'), qLimit(1));
    return snaps[0] ?? null;
  },

  async latestRecommendations(limit = 7): Promise<RateRecommendation[]> {
    return fetchItems<RateRecommendation>('rate_recommendations', orderBy('date', 'asc'), qLimit(limit));
  },

  async recentPushLogs(limit = 5): Promise<RatePushLog[]> {
    return fetchItems<RatePushLog>('rate_push_log', orderBy('runAt', 'desc'), qLimit(limit));
  },

  async demandEvents(): Promise<DemandEvent[]> {
    return fetchItems<DemandEvent>('demand_events', orderBy('date', 'asc'));
  },

  async setAutoPush(enabled: boolean) {
    const propertyId = tenantService.getActivePropertyId();
    const ref = doc(db, `properties/${propertyId}/revenue_settings`, 'automation');
    await setDoc(ref, { autoPushEnabled: enabled, updatedAt: Date.now(), propertyId }, { merge: true });
  }
};

export default revenueAutomationService;
