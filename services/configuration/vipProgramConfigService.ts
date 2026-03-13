import { tenantService } from '../kernel/tenantService';

export const VIP_PROGRAM_CONFIG_UPDATED_EVENT = 'hs:vip-program-config-updated';

export type VipTierId = 'VIP' | 'VVIP' | 'HouseVIP';
export type VipTouchpointId = 'preArrival' | 'arrival' | 'inStay' | 'recovery' | 'departure';

export interface VipAmenityItem {
    id: string;
    label: string;
    description: string;
    department: string;
    quantity: number;
    frequency: 'once_per_stay' | 'once_per_day' | 'on_recovery';
    unitCost: number;
    currency: string;
}

export interface VipAmenityPackage {
    id: string;
    name: string;
    appliesTo: VipTierId[];
    deliveryWindow: string;
    notes: string;
    items: VipAmenityItem[];
}

export interface VipTierConfig {
    id: VipTierId;
    enabled: boolean;
    minPriorityScore: number;
    recognitionLanguage: string;
    escalationPath: string[];
    doRules: string[];
    dontRules: string[];
    touchpoints: Record<VipTouchpointId, string[]>;
    amenityPackageId: string;
    benefits: {
        upgradePriority: number;
        lateCheckoutHours: number;
        dedicatedConcierge: boolean;
        complimentaryTransfers: boolean;
        bonusPointsMultiplier: number;
    };
}

export interface LoyaltyRewardConfig {
    baseRoomPointsPerCurrency: number;
    baseFnBPointsPerCurrency: number;
    baseSpaPointsPerCurrency: number;
    bonusMultipliers: Record<'Standard' | VipTierId, number>;
    redemptionValuePer100Points: number;
    minimumRedeemPoints: number;
    allowCashAndPoints: boolean;
    pointsExpiryMonths: number;
    blackoutEnabled: boolean;
    blackoutNotes: string;
}

export interface VipProgramConfiguration {
    id: 'vip_loyalty_program';
    version: number;
    updatedAt: string;
    updatedBy: string;
    approvedAt: string;
    approvedBy: string;
    effectiveFrom: string;
    notes: string;
    tiers: VipTierConfig[];
    amenities: VipAmenityPackage[];
    loyalty: LoyaltyRewardConfig;
}

export interface VipProgramState {
    draft: VipProgramConfiguration;
    published: VipProgramConfiguration;
    history: VipProgramConfiguration[];
}

const STORAGE_KEY_PREFIX = 'vip_program_configuration_v2';
const HISTORY_LIMIT = 20;

const canUseStorage = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const resolvePropertyId = (provided?: string): string => {
    if (provided && provided.trim()) return provided.trim();
    try {
        return tenantService.getActivePropertyId();
    } catch {
        return 'default_property';
    }
};

const storageKeyFor = (propertyId: string) => `${STORAGE_KEY_PREFIX}:${propertyId}`;

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const defaultTiers = (): VipTierConfig[] => ([
    {
        id: 'VIP',
        enabled: true,
        minPriorityScore: 70,
        recognitionLanguage: 'Recognize guest by name, confirm preferences, and acknowledge loyalty.',
        escalationPath: ['Front Office Supervisor', 'Duty Manager'],
        doRules: [
            'Offer early check-in when inventory permits.',
            'Prioritize room assignment readiness.',
            'Route issue follow-up within 30 minutes.'
        ],
        dontRules: [
            'Do not promise upgrades before inventory confirmation.',
            'Do not delay service recovery acknowledgment.'
        ],
        touchpoints: {
            preArrival: ['Validate profile and preferences 24h before arrival.', 'Pre-block room by profile fit.'],
            arrival: ['Priority check-in lane.', 'Welcome note and amenity confirmation.'],
            inStay: ['Daily touchpoint message.', 'Monitor open requests with priority SLA.'],
            recovery: ['Offer service recovery token within policy threshold.'],
            departure: ['Express checkout option and next-stay offer.']
        },
        amenityPackageId: 'amenity_vip',
        benefits: {
            upgradePriority: 2,
            lateCheckoutHours: 2,
            dedicatedConcierge: false,
            complimentaryTransfers: false,
            bonusPointsMultiplier: 1.2
        }
    },
    {
        id: 'VVIP',
        enabled: true,
        minPriorityScore: 85,
        recognitionLanguage: 'Apply elevated recognition script and confirm service owner at check-in.',
        escalationPath: ['Duty Manager', 'General Manager'],
        doRules: [
            'Assign senior agent on arrival.',
            'Trigger priority housekeeping and amenity setup.',
            'Escalate unresolved incidents within 15 minutes.'
        ],
        dontRules: [
            'Do not downgrade assigned room category without manager approval.',
            'Do not close incidents without callback confirmation.'
        ],
        touchpoints: {
            preArrival: ['Review last-stay notes and loyalty history.', 'Confirm custom amenities.'],
            arrival: ['Manager greeting where available.', 'Offer room orientation and key services.'],
            inStay: ['Twice-daily service pulse check.', 'Fast-track all service requests.'],
            recovery: ['Immediate duty manager involvement and compensation review.'],
            departure: ['Manager farewell note and tailored return incentive.']
        },
        amenityPackageId: 'amenity_vvip',
        benefits: {
            upgradePriority: 1,
            lateCheckoutHours: 4,
            dedicatedConcierge: true,
            complimentaryTransfers: true,
            bonusPointsMultiplier: 1.5
        }
    },
    {
        id: 'HouseVIP',
        enabled: true,
        minPriorityScore: 92,
        recognitionLanguage: 'Apply executive protocol with direct host ownership and cross-department alignment.',
        escalationPath: ['General Manager', 'Executive Committee'],
        doRules: [
            'Assign a single service owner for full stay.',
            'Pre-approve elevated service recovery limits.',
            'Coordinate all departments before arrival.'
        ],
        dontRules: [
            'Do not expose operational constraints to guest.',
            'Do not modify approved benefits without executive approval.'
        ],
        touchpoints: {
            preArrival: ['Run pre-arrival briefing with FO, HK, F&B, Guest Relations.', 'Verify all preference fulfillment commitments.'],
            arrival: ['Executive greeting and expedited formalities.', 'Escort to room with amenity walkthrough.'],
            inStay: ['Dedicated host outreach each shift.', 'Proactive itinerary and service adjustments.'],
            recovery: ['Executive-level service recovery with immediate resolution authority.'],
            departure: ['Executive checkout follow-up and retention plan logging.']
        },
        amenityPackageId: 'amenity_house_vip',
        benefits: {
            upgradePriority: 0,
            lateCheckoutHours: 6,
            dedicatedConcierge: true,
            complimentaryTransfers: true,
            bonusPointsMultiplier: 2
        }
    }
]);

const defaultAmenities = (): VipAmenityPackage[] => ([
    {
        id: 'amenity_vip',
        name: 'VIP Arrival Signature',
        appliesTo: ['VIP'],
        deliveryWindow: 'Within 30 minutes of check-in',
        notes: 'Charge to Guest Relations cost center.',
        items: [
            {
                id: 'amenity_vip_fruit',
                label: 'Seasonal fruit plate',
                description: 'Fresh fruit platter with card.',
                department: 'F&B',
                quantity: 1,
                frequency: 'once_per_stay',
                unitCost: 6,
                currency: 'BHD'
            },
            {
                id: 'amenity_vip_note',
                label: 'Personalized welcome card',
                description: 'Printed card signed by duty manager.',
                department: 'Front Office',
                quantity: 1,
                frequency: 'once_per_stay',
                unitCost: 1,
                currency: 'BHD'
            }
        ]
    },
    {
        id: 'amenity_vvip',
        name: 'VVIP Elevated Package',
        appliesTo: ['VVIP'],
        deliveryWindow: 'In-room before arrival',
        notes: 'Include lounge access reminder.',
        items: [
            {
                id: 'amenity_vvip_snack',
                label: 'Premium snack selection',
                description: 'Chef curated snack box.',
                department: 'F&B',
                quantity: 1,
                frequency: 'once_per_stay',
                unitCost: 14,
                currency: 'BHD'
            },
            {
                id: 'amenity_vvip_transport',
                label: 'Arrival transfer setup',
                description: 'One-way airport transfer arrangement.',
                department: 'Guest Relations',
                quantity: 1,
                frequency: 'once_per_stay',
                unitCost: 18,
                currency: 'BHD'
            }
        ]
    },
    {
        id: 'amenity_house_vip',
        name: 'HouseVIP Executive Package',
        appliesTo: ['HouseVIP'],
        deliveryWindow: 'Pre-arrival completed 6 hours prior',
        notes: 'Includes executive host readiness checklist.',
        items: [
            {
                id: 'amenity_house_vip_curated',
                label: 'Curated in-room setup',
                description: 'Custom amenity composition from guest profile.',
                department: 'Guest Relations',
                quantity: 1,
                frequency: 'once_per_stay',
                unitCost: 25,
                currency: 'BHD'
            },
            {
                id: 'amenity_house_vip_recovery',
                label: 'Recovery reserve credit',
                description: 'Pre-authorized service recovery credit pool.',
                department: 'Front Office',
                quantity: 1,
                frequency: 'on_recovery',
                unitCost: 30,
                currency: 'BHD'
            }
        ]
    }
]);

const defaultLoyalty = (): LoyaltyRewardConfig => ({
    baseRoomPointsPerCurrency: 12,
    baseFnBPointsPerCurrency: 6,
    baseSpaPointsPerCurrency: 8,
    bonusMultipliers: {
        Standard: 1,
        VIP: 1.2,
        VVIP: 1.5,
        HouseVIP: 2
    },
    redemptionValuePer100Points: 1,
    minimumRedeemPoints: 1000,
    allowCashAndPoints: true,
    pointsExpiryMonths: 24,
    blackoutEnabled: false,
    blackoutNotes: ''
});

const createDefaultConfig = (updatedBy = 'system'): VipProgramConfiguration => {
    const now = new Date().toISOString();
    return {
        id: 'vip_loyalty_program',
        version: 1,
        updatedAt: now,
        updatedBy,
        approvedAt: '',
        approvedBy: '',
        effectiveFrom: '',
        notes: 'Baseline VIP + loyalty policy draft.',
        tiers: defaultTiers(),
        amenities: defaultAmenities(),
        loyalty: defaultLoyalty()
    };
};

const createDefaultState = (): VipProgramState => {
    const defaultConfig = createDefaultConfig();
    return {
        draft: defaultConfig,
        published: {
            ...defaultConfig,
            approvedAt: '',
            approvedBy: '',
            effectiveFrom: ''
        },
        history: []
    };
};

const normalizeState = (incoming?: Partial<VipProgramState> | null): VipProgramState => {
    if (!incoming) return createDefaultState();
    const baseline = createDefaultState();
    return {
        draft: {
            ...baseline.draft,
            ...(incoming.draft || {})
        },
        published: {
            ...baseline.published,
            ...(incoming.published || {})
        },
        history: Array.isArray(incoming.history)
            ? incoming.history.slice(-HISTORY_LIMIT)
            : []
    };
};

const emitUpdate = (state: VipProgramState, propertyId: string) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
        new CustomEvent(VIP_PROGRAM_CONFIG_UPDATED_EVENT, {
            detail: {
                propertyId,
                state
            }
        })
    );
};

export const getVipProgramState = (propertyId?: string): VipProgramState => {
    const pid = resolvePropertyId(propertyId);
    if (!canUseStorage()) return createDefaultState();

    try {
        const raw = localStorage.getItem(storageKeyFor(pid));
        if (!raw) return createDefaultState();
        return normalizeState(JSON.parse(raw) as Partial<VipProgramState>);
    } catch (error) {
        console.warn('[VIP Config] Failed to parse stored state. Resetting defaults.', error);
        return createDefaultState();
    }
};

export const saveVipProgramState = (state: VipProgramState, propertyId?: string): VipProgramState => {
    const pid = resolvePropertyId(propertyId);
    const normalized = normalizeState(state);
    if (!canUseStorage()) return normalized;

    localStorage.setItem(storageKeyFor(pid), JSON.stringify(normalized));
    emitUpdate(normalized, pid);
    return normalized;
};

export const saveVipProgramDraft = (
    draft: VipProgramConfiguration,
    updatedBy = 'configuration',
    propertyId?: string
): VipProgramState => {
    const current = getVipProgramState(propertyId);
    const nextDraft: VipProgramConfiguration = {
        ...deepClone(draft),
        id: 'vip_loyalty_program',
        updatedAt: new Date().toISOString(),
        updatedBy,
        approvedAt: '',
        approvedBy: '',
        effectiveFrom: ''
    };
    return saveVipProgramState(
        {
            ...current,
            draft: nextDraft
        },
        propertyId
    );
};

export const publishVipProgramConfiguration = (
    approvedBy = 'GM',
    propertyId?: string
): VipProgramState => {
    const current = getVipProgramState(propertyId);
    const publishedVersion = Math.max(1, (current.published?.version || 0) + 1);
    const now = new Date().toISOString();
    const previousPublished = current.published?.approvedAt ? [current.published, ...current.history] : current.history;
    const published: VipProgramConfiguration = {
        ...deepClone(current.draft),
        version: publishedVersion,
        updatedAt: now,
        updatedBy: approvedBy,
        approvedAt: now,
        approvedBy,
        effectiveFrom: now
    };

    return saveVipProgramState(
        {
            draft: published,
            published,
            history: previousPublished.slice(0, HISTORY_LIMIT)
        },
        propertyId
    );
};

export const getPublishedVipProgramConfiguration = (propertyId?: string): VipProgramConfiguration => {
    return getVipProgramState(propertyId).published;
};

export const generateVipPolicyStandardMarkdown = (config: VipProgramConfiguration): string => {
    const lines: string[] = [];
    lines.push('# VIP & Loyalty Standards (Generated)');
    lines.push('');
    lines.push(`- Version: v${config.version}`);
    lines.push(`- Effective From: ${config.effectiveFrom || 'Not published'}`);
    lines.push(`- Approved By: ${config.approvedBy || 'Not published'}`);
    lines.push(`- Updated At: ${config.updatedAt}`);
    lines.push('');
    lines.push('## VIP Tier Definitions');
    lines.push('');

    for (const tier of config.tiers) {
        lines.push(`### ${tier.id}`);
        lines.push(`- Enabled: ${tier.enabled ? 'Yes' : 'No'}`);
        lines.push(`- Min Priority Score: ${tier.minPriorityScore}`);
        lines.push(`- Recognition Language: ${tier.recognitionLanguage}`);
        lines.push(`- Amenity Package: ${tier.amenityPackageId}`);
        lines.push(`- Escalation Path: ${tier.escalationPath.join(' > ') || 'None'}`);
        lines.push('- Do Rules:');
        tier.doRules.forEach((rule) => lines.push(`  - ${rule}`));
        lines.push('- Do Not Rules:');
        tier.dontRules.forEach((rule) => lines.push(`  - ${rule}`));
        lines.push('- Touchpoint Checklist:');
        lines.push('  - Pre-arrival:');
        tier.touchpoints.preArrival.forEach((item) => lines.push(`    - ${item}`));
        lines.push('  - Arrival:');
        tier.touchpoints.arrival.forEach((item) => lines.push(`    - ${item}`));
        lines.push('  - In-stay:');
        tier.touchpoints.inStay.forEach((item) => lines.push(`    - ${item}`));
        lines.push('  - Recovery:');
        tier.touchpoints.recovery.forEach((item) => lines.push(`    - ${item}`));
        lines.push('  - Departure:');
        tier.touchpoints.departure.forEach((item) => lines.push(`    - ${item}`));
        lines.push('');
    }

    lines.push('## Loyalty Reward Configuration');
    lines.push('');
    lines.push(`- Base Room Points / Currency Unit: ${config.loyalty.baseRoomPointsPerCurrency}`);
    lines.push(`- Base F&B Points / Currency Unit: ${config.loyalty.baseFnBPointsPerCurrency}`);
    lines.push(`- Base Spa Points / Currency Unit: ${config.loyalty.baseSpaPointsPerCurrency}`);
    lines.push(`- Redemption Value Per 100 Points: ${config.loyalty.redemptionValuePer100Points}`);
    lines.push(`- Minimum Redemption Points: ${config.loyalty.minimumRedeemPoints}`);
    lines.push(`- Cash + Points Enabled: ${config.loyalty.allowCashAndPoints ? 'Yes' : 'No'}`);
    lines.push(`- Points Expiry (Months): ${config.loyalty.pointsExpiryMonths}`);
    lines.push(`- Blackout Enabled: ${config.loyalty.blackoutEnabled ? 'Yes' : 'No'}`);
    if (config.loyalty.blackoutNotes) lines.push(`- Blackout Notes: ${config.loyalty.blackoutNotes}`);
    lines.push('- Bonus Multipliers:');
    lines.push(`  - Standard: x${config.loyalty.bonusMultipliers.Standard}`);
    lines.push(`  - VIP: x${config.loyalty.bonusMultipliers.VIP}`);
    lines.push(`  - VVIP: x${config.loyalty.bonusMultipliers.VVIP}`);
    lines.push(`  - HouseVIP: x${config.loyalty.bonusMultipliers.HouseVIP}`);
    lines.push('');

    lines.push('## VIP Amenity Standards');
    lines.push('');
    for (const pkg of config.amenities) {
        lines.push(`### ${pkg.name}`);
        lines.push(`- Applies To: ${pkg.appliesTo.join(', ')}`);
        lines.push(`- Delivery Window: ${pkg.deliveryWindow}`);
        if (pkg.notes) lines.push(`- Notes: ${pkg.notes}`);
        lines.push('- Items:');
        pkg.items.forEach((item) => {
            lines.push(`  - ${item.label} (${item.department}) x${item.quantity} · ${item.frequency} · ${item.currency} ${item.unitCost}`);
            if (item.description) lines.push(`    - ${item.description}`);
        });
        lines.push('');
    }

    return lines.join('\n');
};
