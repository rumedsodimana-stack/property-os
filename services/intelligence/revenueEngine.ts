import { subscribeToItems, addItem, updateItem, deleteItem } from '../kernel/firestoreService';
import { YieldRule } from '../../types';

class RevenueEngine {
    private rules: YieldRule[] = [];
    private unsubscribe: (() => void) | null = null;
    private initialized = false;
    private listeners: ((rules: YieldRule[]) => void)[] = [];

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (this.initialized) return;

        this.unsubscribe = subscribeToItems<YieldRule>('yield_rules', (rules) => {
            if (rules.length === 0) {
                this.seedDefaultRules();
            } else {
                this.rules = rules;
                this.notifyListeners();
            }
        });

        this.initialized = true;
    }

    subscribe(listener: (rules: YieldRule[]) => void) {
        this.listeners.push(listener);
        listener(this.rules);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l(this.rules));
    }

    getRules(): YieldRule[] {
        return [...this.rules];
    }

    async saveRule(rule: YieldRule): Promise<void> {
        if (this.rules.some(r => r.id === rule.id)) {
            await updateItem('yield_rules', rule.id, rule);
        } else {
            await addItem('yield_rules', rule);
        }
    }

    async deleteRule(id: string): Promise<void> {
        await deleteItem('yield_rules', id);
    }

    async toggleRule(id: string, isActive: boolean): Promise<void> {
        await updateItem('yield_rules', id, { isActive });
    }

    /**
     * Evaluates current dynamic pricing adjustment based on yield rules.
     * Returns a multiplier, e.g., 1.15 for a 15% increase, or 1.0 for no change.
     */
    calculateMultiplier(currentOccupancy: number, daysToArrival: number): number {
        let multiplier = 1.0;

        for (const rule of this.rules.filter(r => r.isActive)) {
            let conditionMet = false;

            if (rule.condition.metric === 'Occupancy') {
                conditionMet = this.evaluateCondition(currentOccupancy, rule.condition.operator, rule.condition.value);
            } else if (rule.condition.metric === 'LeadTime') {
                conditionMet = this.evaluateCondition(daysToArrival, rule.condition.operator, rule.condition.value);
            }

            if (conditionMet) {
                if (rule.action.adjustmentType === 'Increase' && rule.action.valueType === 'Percentage') {
                    multiplier += (rule.action.value / 100);
                } else if (rule.action.adjustmentType === 'Decrease' && rule.action.valueType === 'Percentage') {
                    multiplier -= (rule.action.value / 100);
                }
                // (Flat pricing adjustments are harder to model as a simple multiplier, so we focus on percentage yields here)
            }
        }

        return Math.max(0.5, multiplier); // Cap at 50% max decrease
    }

    private evaluateCondition(actual: number, operator: string, target: number): boolean {
        switch (operator) {
            case '>': return actual > target;
            case '<': return actual < target;
            case '>=': return actual >= target;
            case '<=': return actual <= target;
            case '==': return actual === target;
            default: return false;
        }
    }

    private async seedDefaultRules() {
        const defaultRules: YieldRule[] = [
            {
                id: 'yr_high_occ',
                name: 'High Occupancy Premium',
                condition: { metric: 'Occupancy', operator: '>', value: 85 },
                action: { adjustmentType: 'Increase', valueType: 'Percentage', value: 15 },
                isActive: true
            },
            {
                id: 'yr_last_min',
                name: 'Last Minute Drop (Low Occ)',
                condition: { metric: 'LeadTime', operator: '<=', value: 2 },
                action: { adjustmentType: 'Decrease', valueType: 'Percentage', value: 10 },
                isActive: false
            }
        ];

        for (const rule of defaultRules) {
            await addItem('yield_rules', rule);
        }
    }
}

export const revenueEngine = new RevenueEngine();
export default RevenueEngine;
