import { fetchItem, fetchItems, addItem, updateItem } from '../kernel/firestoreService';
import { tenantService } from '../kernel/tenantService';
import { User } from '../../types';

export type LoyaltyTier = 'Standard' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

const TIER_RULES: Record<LoyaltyTier, { threshold: number; multiplier: number }> = {
  Standard: { threshold: 0, multiplier: 1 },
  Silver: { threshold: 5000, multiplier: 1.05 },
  Gold: { threshold: 12000, multiplier: 1.1 },
  Platinum: { threshold: 24000, multiplier: 1.15 },
  Diamond: { threshold: 40000, multiplier: 1.2 },
};

export const loyaltyService = {
  async awardStayPoints(guestId: string, folioTotal: number) {
    const propertyId = tenantService.getActivePropertyId();
    const guest = await fetchItem<User>('guests', guestId);
    if (!guest) throw new Error('Guest not found');
    const basePoints = folioTotal; // 1 point per currency unit
    const multiplier = TIER_RULES[(guest.loyaltyTier as LoyaltyTier) || 'Standard']?.multiplier || 1;
    const pointsEarned = Math.round(basePoints * multiplier);
    await addItem(`properties/${propertyId}/loyalty_ledger`, {
      guestId,
      points: pointsEarned,
      folioTotal,
      propertyId,
      type: 'earn',
      createdAt: Date.now(),
    });
    await updateItem('guests', guestId, {
      loyaltyPoints: (guest as any).loyaltyPoints ? (guest as any).loyaltyPoints + pointsEarned : pointsEarned,
    });
    await loyaltyService.recomputeTier(guestId);
    return pointsEarned;
  },

  async redeemPoints(guestId: string, points: number, reason: string) {
    const guest = await fetchItem<User>('guests', guestId);
    if (!guest) throw new Error('Guest not found');
    const current = (guest as any).loyaltyPoints || 0;
    if (points > current) throw new Error('Insufficient points');
    await addItem(`properties/${tenantService.getActivePropertyId()}/loyalty_ledger`, {
      guestId,
      points: -points,
      reason,
      type: 'redeem',
      createdAt: Date.now(),
    });
    await updateItem('guests', guestId, { loyaltyPoints: current - points });
  },

  async recomputeTier(guestId: string) {
    const guest = await fetchItem<User>('guests', guestId);
    if (!guest) return null;
    const points = (guest as any).loyaltyPoints || 0;
    const tier = (Object.entries(TIER_RULES) as [LoyaltyTier, { threshold: number; multiplier: number }][]).reverse()
      .find(([, cfg]) => points >= cfg.threshold)?.[0] || 'Standard';
    await updateItem('guests', guestId, { loyaltyTier: tier });
    return tier;
  },

  async getLedger(guestId: string) {
    const propertyId = tenantService.getActivePropertyId();
    return fetchItems<any>(`properties/${propertyId}/loyalty_ledger`);
  }
};
