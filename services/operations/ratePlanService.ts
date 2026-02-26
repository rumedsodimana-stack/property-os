import { RatePlan } from '../../types';
import { subscribeToItems, addItem, updateItem, deleteItem } from '../kernel/firestoreService';

class RatePlanService {
    private ratePlans: RatePlan[] = [];
    private unsubscribe: (() => void) | null = null;
    private initialized = false;
    private listeners: ((plans: RatePlan[]) => void)[] = [];

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (this.initialized) return;

        this.unsubscribe = subscribeToItems<RatePlan>('rate_plans', (plans) => {
            // Seed default plans if empty
            if (plans.length === 0) {
                this.seedDefaultPlans();
            } else {
                this.ratePlans = plans;
                this.notifyListeners();
            }
        });

        this.initialized = true;
    }

    subscribe(listener: (plans: RatePlan[]) => void) {
        this.listeners.push(listener);
        listener(this.ratePlans);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l(this.ratePlans));
    }

    getRatePlans(): RatePlan[] {
        return [...this.ratePlans];
    }

    getRatePlanById(id: string): RatePlan | undefined {
        return this.ratePlans.find(rp => rp.id === id);
    }

    async saveRatePlan(plan: RatePlan): Promise<void> {
        if (this.ratePlans.some(rp => rp.id === plan.id)) {
            await updateItem('rate_plans', plan.id, plan);
        } else {
            await addItem('rate_plans', plan);
        }
    }

    async deleteRatePlan(id: string): Promise<void> {
        await deleteItem('rate_plans', id);
    }

    /**
     * Calculates the daily rate for a given plan.
     * Required for derived rates (e.g., ADV is 10% less than BAR)
     */
    calculateDailyRate(planId: string): number {
        const plan = this.getRatePlanById(planId);
        if (!plan) return 0;

        if (plan.type === 'Base') {
            return plan.baseRateAmount;
        }

        if (plan.type === 'Derived' && plan.derivedFromId) {
            const basePlan = this.getRatePlanById(plan.derivedFromId);
            if (!basePlan) return plan.baseRateAmount; // Fallback

            const baseAmount = basePlan.baseRateAmount;

            if (plan.derivedAdjustmentType === 'Percentage') {
                const adj = plan.derivedAdjustmentValue || 0;
                return baseAmount + (baseAmount * (adj / 100)); // So -10 becomes 0.9 * base
            } else if (plan.derivedAdjustmentType === 'Flat') {
                return baseAmount + (plan.derivedAdjustmentValue || 0);
            }
        }

        return plan.baseRateAmount;
    }

    private async seedDefaultPlans() {
        const defaultPlans: RatePlan[] = [
            {
                id: 'rp_bar',
                code: 'BAR',
                name: 'Best Available Rate',
                description: 'Standard flexible daily rate',
                baseRateAmount: 150,
                currency: 'BHD',
                type: 'Base',
                inclusions: [],
                cancellationPolicy: 'Flexible 24h',
                guaranteeType: 'Credit Card',
                isActive: true
            },
            {
                id: 'rp_adv',
                code: 'ADV',
                name: 'Advance Purchase',
                description: 'Non-refundable rate booked 14+ days in advance',
                baseRateAmount: 0, // Calculated
                currency: 'BHD',
                type: 'Derived',
                derivedFromId: 'rp_bar',
                derivedAdjustmentType: 'Percentage',
                derivedAdjustmentValue: -15, // 15% off BAR
                inclusions: [],
                cancellationPolicy: 'Non-Refundable',
                guaranteeType: 'Deposit',
                isActive: true
            },
            {
                id: 'rp_bb',
                code: 'BB',
                name: 'Bed & Breakfast',
                description: 'Includes daily breakfast for 2',
                baseRateAmount: 180,
                currency: 'BHD',
                type: 'Base',
                inclusions: [
                    { id: 'inc_bfast', name: 'Breakfast Buffet', amount: 15, calculationRule: 'Per Person', routingCode: 'F&B_REV' }
                ],
                cancellationPolicy: 'Flexible 24h',
                guaranteeType: 'Credit Card',
                isActive: true
            }
        ];

        for (const plan of defaultPlans) {
            await addItem('rate_plans', plan);
        }
    }
}

export const ratePlanService = new RatePlanService();
export default RatePlanService;
