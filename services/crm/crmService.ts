import { addItem, updateItem, fetchItems, fetchItem, deleteItem, getCollectionRef } from "../kernel/firestoreService";
import { Campaign, CrmTask, GuestProfile, Segment, SegmentRule, Interaction, Contact, CompanyAccount, Channel } from "../../types/crm";
import { db } from '../kernel/firebase';
import { query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// ─── Helpers ────────────────────────────────────────────────────────────────

const generateId = (prefix: string): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${prefix}_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const now = () => new Date().toISOString();

/**
 * Evaluate a single segment rule against a guest profile.
 */
const evaluateRule = (profile: GuestProfile, rule: SegmentRule): boolean => {
    const value = (profile as any)[rule.field];
    if (value === undefined || value === null) return false;

    switch (rule.op) {
        case 'eq': return value === rule.value;
        case 'neq': return value !== rule.value;
        case 'gt': return typeof value === 'number' && value > (rule.value as number);
        case 'lt': return typeof value === 'number' && value < (rule.value as number);
        case 'gte': return typeof value === 'number' && value >= (rule.value as number);
        case 'lte': return typeof value === 'number' && value <= (rule.value as number);
        case 'contains': return typeof value === 'string' && value.toLowerCase().includes(String(rule.value).toLowerCase());
        default: return false;
    }
};

/**
 * Test whether a guest profile matches ALL rules in a segment.
 */
const profileMatchesSegment = (profile: GuestProfile, rules: SegmentRule[]): boolean => {
    return rules.every(rule => evaluateRule(profile, rule));
};

// ─── Service ────────────────────────────────────────────────────────────────

export const crmService = {

    // ═══════════════════════════════════════════════════════════════════════
    // PROFILES — CRUD
    // ═══════════════════════════════════════════════════════════════════════

    async listProfiles(): Promise<GuestProfile[]> {
        return fetchItems<GuestProfile>('crm_profiles');
    },

    async getProfile(id: string): Promise<GuestProfile | null> {
        return fetchItem<GuestProfile>('crm_profiles', id);
    },

    async upsertProfile(profile: GuestProfile): Promise<void> {
        await updateItem('crm_profiles', profile.id, { ...profile, updatedAt: now() });
    },

    async mergeProfile(sourceId: string, targetId: string): Promise<void> {
        const source = await fetchItem<GuestProfile>('crm_profiles', sourceId);
        const target = await fetchItem<GuestProfile>('crm_profiles', targetId);
        if (!source || !target) throw new Error('[CRM] Cannot merge: profile not found');

        // Move interactions from source to target
        const interactions = await this.getInteractionsForProfile(sourceId);
        for (const ix of interactions) {
            await updateItem('crm_interactions', ix.id, { profileId: targetId });
        }

        // Merge spend
        const mergedSpend = (target.totalSpend || 0) + (source.totalSpend || 0);
        await updateItem('crm_profiles', targetId, { totalSpend: mergedSpend, updatedAt: now() });

        // Mark source as merged
        await updateItem('crm_profiles', sourceId, { mergedIntoId: targetId, updatedAt: now() });
        console.log(`[CRM] Merged profile ${sourceId} into ${targetId}`);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SEARCH & FILTER
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Search profiles by name, email, or phone (client-side filter after fetch).
     * For large datasets this should use a search index; for now we filter in memory.
     */
    async searchProfiles(term: string): Promise<GuestProfile[]> {
        const all = await fetchItems<GuestProfile>('crm_profiles');
        const lower = term.toLowerCase();
        return all.filter(p =>
            !p.mergedIntoId && (
                p.fullName.toLowerCase().includes(lower) ||
                (p.email || '').toLowerCase().includes(lower) ||
                (p.phone || '').includes(term)
            )
        );
    },

    /**
     * Filter profiles by arbitrary field/value pairs.
     */
    async filterProfiles(filters: Record<string, any>): Promise<GuestProfile[]> {
        const all = await fetchItems<GuestProfile>('crm_profiles');
        return all.filter(p => {
            if (p.mergedIntoId) return false;
            return Object.entries(filters).every(([key, val]) => (p as any)[key] === val);
        });
    },

    // ═══════════════════════════════════════════════════════════════════════
    // GUEST SEGMENTATION
    // ═══════════════════════════════════════════════════════════════════════

    async listSegments(): Promise<Segment[]> {
        return fetchItems<Segment>('crm_segments');
    },

    async upsertSegment(segment: Segment): Promise<void> {
        await updateItem('crm_segments', segment.id, { ...segment, updatedAt: now() });
    },

    /**
     * Evaluate a segment against all active profiles and return matching IDs + count.
     */
    async evaluateSegment(segmentId: string): Promise<{ profileIds: string[]; count: number }> {
        const segment = await fetchItem<Segment>('crm_segments', segmentId);
        if (!segment) throw new Error(`[CRM] Segment ${segmentId} not found`);

        const profiles = await fetchItems<GuestProfile>('crm_profiles');
        const active = profiles.filter(p => !p.mergedIntoId);
        const matching = active.filter(p => profileMatchesSegment(p, segment.rules));
        const profileIds = matching.map(p => p.id);

        // Persist estimated count back to the segment
        await updateItem('crm_segments', segmentId, { estimatedCount: profileIds.length, updatedAt: now() });

        return { profileIds, count: profileIds.length };
    },

    /**
     * Convenience: auto-segment guests into tiers based on lifetime value.
     * Thresholds are configurable; defaults follow typical hospitality bands.
     */
    async autoSegmentByLTV(thresholds?: { vip: number; loyal: number; regular: number }): Promise<Record<string, string[]>> {
        const t = thresholds || { vip: 10000, loyal: 3000, regular: 500 };
        const profiles = await fetchItems<GuestProfile>('crm_profiles');
        const active = profiles.filter(p => !p.mergedIntoId);

        const buckets: Record<string, string[]> = { vip: [], loyal: [], regular: [], prospect: [] };

        for (const p of active) {
            const ltv = p.totalSpend || 0;
            if (ltv >= t.vip) buckets.vip.push(p.id);
            else if (ltv >= t.loyal) buckets.loyal.push(p.id);
            else if (ltv >= t.regular) buckets.regular.push(p.id);
            else buckets.prospect.push(p.id);
        }

        console.log(`[CRM] Auto-segmented ${active.length} profiles: VIP=${buckets.vip.length}, Loyal=${buckets.loyal.length}, Regular=${buckets.regular.length}, Prospect=${buckets.prospect.length}`);
        return buckets;
    },

    // ═══════════════════════════════════════════════════════════════════════
    // LIFETIME VALUE CALCULATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Calculate guest lifetime value from interactions and reservation data.
     * LTV = total revenue attributed to this guest across all stays and spend.
     */
    async calculateLifetimeValue(profileId: string): Promise<{
        totalSpend: number;
        stayCount: number;
        avgSpendPerStay: number;
        firstInteraction: string | null;
        latestInteraction: string | null;
        estimatedAnnualValue: number;
    }> {
        const profile = await fetchItem<GuestProfile>('crm_profiles', profileId);
        if (!profile) throw new Error(`[CRM] Profile ${profileId} not found`);

        const interactions = await this.getInteractionsForProfile(profileId);
        const stays = interactions.filter(i => i.type === 'stay');
        const posInteractions = interactions.filter(i => i.type === 'pos');

        const totalSpend = profile.totalSpend || 0;
        const stayCount = stays.length;
        const avgSpendPerStay = stayCount > 0 ? totalSpend / stayCount : 0;

        // Sort by timestamp
        const sorted = [...interactions].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        const firstInteraction = sorted.length > 0 ? sorted[0].timestamp : null;
        const latestInteraction = sorted.length > 0 ? sorted[sorted.length - 1].timestamp : null;

        // Estimate annual value: if we know tenure, annualize; otherwise use raw total
        let estimatedAnnualValue = totalSpend;
        if (firstInteraction) {
            const tenureMs = Date.now() - new Date(firstInteraction).getTime();
            const tenureYears = tenureMs / (365.25 * 24 * 60 * 60 * 1000);
            if (tenureYears >= 0.5) {
                estimatedAnnualValue = totalSpend / tenureYears;
            }
        }

        // Persist the updated totalSpend back (idempotent)
        await updateItem('crm_profiles', profileId, { totalSpend, updatedAt: now() });

        return {
            totalSpend,
            stayCount,
            avgSpendPerStay: parseFloat(avgSpendPerStay.toFixed(2)),
            firstInteraction,
            latestInteraction,
            estimatedAnnualValue: parseFloat(estimatedAnnualValue.toFixed(2)),
        };
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CAMPAIGN MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    async listCampaigns(): Promise<Campaign[]> {
        return fetchItems<Campaign>('crm_campaigns');
    },

    async upsertCampaign(campaign: Campaign): Promise<void> {
        await updateItem('crm_campaigns', campaign.id, { ...campaign, updatedAt: now() });
    },

    /**
     * Create a new campaign targeting a specific segment.
     */
    async createCampaign(params: {
        name: string;
        segmentId: string;
        channel: Channel;
        templateId?: string;
        sendAt?: string;
    }): Promise<Campaign> {
        const campaign: Campaign = {
            id: generateId('cmp'),
            name: params.name,
            segmentId: params.segmentId,
            channel: params.channel,
            status: params.sendAt ? 'scheduled' : 'draft',
            sendAt: params.sendAt,
            templateId: params.templateId,
            sentCount: 0,
            failCount: 0,
            createdAt: now(),
            updatedAt: now(),
        };

        await addItem('crm_campaigns', campaign);
        console.log(`[CRM] Campaign created: ${campaign.id} (${campaign.name})`);
        return campaign;
    },

    /**
     * Execute a campaign: resolve the segment, filter by consent, mark as running.
     * Actual message dispatch is external (email/SMS provider); we track counts.
     */
    async executeCampaign(campaignId: string): Promise<{ targeted: number; sent: number; failed: number }> {
        const campaign = await fetchItem<Campaign>('crm_campaigns', campaignId);
        if (!campaign) throw new Error(`[CRM] Campaign ${campaignId} not found`);
        if (campaign.status === 'completed') throw new Error(`[CRM] Campaign already completed`);

        await updateItem('crm_campaigns', campaignId, { status: 'running', updatedAt: now() });

        // Resolve segment
        const { profileIds } = await this.evaluateSegment(campaign.segmentId);

        // Filter by communication preference / consent
        let sentCount = 0;
        let failCount = 0;

        for (const pid of profileIds) {
            const profile = await fetchItem<GuestProfile>('crm_profiles', pid);
            if (!profile) { failCount++; continue; }

            const hasConsent = this.checkConsent(profile, campaign.channel);
            if (!hasConsent) { failCount++; continue; }

            // Record touchpoint
            await this.recordTouchpoint(pid, campaign.channel, 'message', `Campaign: ${campaign.name}`);
            sentCount++;
        }

        await updateItem('crm_campaigns', campaignId, {
            status: 'completed',
            sentCount,
            failCount,
            updatedAt: now(),
        });

        console.log(`[CRM] Campaign ${campaignId} executed: ${sentCount} sent, ${failCount} failed out of ${profileIds.length} targeted`);
        return { targeted: profileIds.length, sent: sentCount, failed: failCount };
    },

    /**
     * Pause a running campaign.
     */
    async pauseCampaign(campaignId: string): Promise<void> {
        await updateItem('crm_campaigns', campaignId, { status: 'paused', updatedAt: now() });
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TOUCHPOINT TRACKING & INTERACTION TIMELINE
    // ═══════════════════════════════════════════════════════════════════════

    async listInteractions(): Promise<Interaction[]> {
        return fetchItems<Interaction>('crm_interactions');
    },

    async upsertInteraction(interaction: Interaction): Promise<void> {
        await updateItem('crm_interactions', interaction.id, interaction);
    },

    /**
     * Get all interactions for a specific profile, sorted newest-first.
     */
    async getInteractionsForProfile(profileId: string): Promise<Interaction[]> {
        try {
            const q = query(
                getCollectionRef('crm_interactions'),
                where('profileId', '==', profileId),
                orderBy('timestamp', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Interaction));
        } catch {
            // Fallback: fetch all and filter (covers missing index)
            const all = await fetchItems<Interaction>('crm_interactions');
            return all
                .filter(i => i.profileId === profileId)
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        }
    },

    /**
     * Record a touchpoint (outbound or inbound guest interaction).
     */
    async recordTouchpoint(
        profileId: string,
        channel: Interaction['channel'],
        type: Interaction['type'],
        subject: string,
        body?: string,
        actor?: string,
        tags?: string[]
    ): Promise<Interaction> {
        const interaction: Interaction = {
            id: generateId('ix'),
            profileId,
            channel,
            type,
            subject,
            body,
            timestamp: now(),
            actor,
            tags,
        };

        await addItem('crm_interactions', interaction);
        console.log(`[CRM] Touchpoint recorded: ${type} on ${channel} for ${profileId}`);
        return interaction;
    },

    /**
     * Build a full interaction timeline for a guest (combines stays, POS, messages, notes).
     */
    async getTimeline(profileId: string): Promise<{
        interactions: Interaction[];
        summary: { total: number; byType: Record<string, number>; byChannel: Record<string, number> };
    }> {
        const interactions = await this.getInteractionsForProfile(profileId);

        const byType: Record<string, number> = {};
        const byChannel: Record<string, number> = {};

        for (const ix of interactions) {
            byType[ix.type] = (byType[ix.type] || 0) + 1;
            byChannel[ix.channel] = (byChannel[ix.channel] || 0) + 1;
        }

        return {
            interactions,
            summary: { total: interactions.length, byType, byChannel },
        };
    },

    // ═══════════════════════════════════════════════════════════════════════
    // COMMUNICATION PREFERENCES / CONSENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Check if a guest has opted-in to a specific channel.
     */
    checkConsent(profile: GuestProfile, channel: Channel): boolean {
        if (!profile.consents || profile.consents.length === 0) return false;
        const consent = profile.consents.find(c => c.channel === channel);
        return consent?.status === 'opt_in';
    },

    /**
     * Update communication preference for a guest on a given channel.
     */
    async updateConsent(profileId: string, channel: Channel, optIn: boolean, source?: string): Promise<void> {
        const profile = await fetchItem<GuestProfile>('crm_profiles', profileId);
        if (!profile) throw new Error(`[CRM] Profile ${profileId} not found`);

        const consents = profile.consents || [];
        const existing = consents.findIndex(c => c.channel === channel);
        const entry = { channel, status: optIn ? 'opt_in' as const : 'opt_out' as const, updatedAt: now(), source };

        if (existing >= 0) {
            consents[existing] = entry;
        } else {
            consents.push(entry);
        }

        await updateItem('crm_profiles', profileId, { consents, updatedAt: now() });
        console.log(`[CRM] Consent updated: ${profileId} ${channel} => ${optIn ? 'opt_in' : 'opt_out'}`);
    },

    /**
     * Get all communication preferences for a guest.
     */
    async getConsentSummary(profileId: string): Promise<Record<Channel, 'opt_in' | 'opt_out' | 'unknown'>> {
        const profile = await fetchItem<GuestProfile>('crm_profiles', profileId);
        const channels: Channel[] = ['email', 'sms', 'whatsapp', 'push'];
        const result: Record<string, string> = {};

        for (const ch of channels) {
            const consent = profile?.consents?.find(c => c.channel === ch);
            result[ch] = consent?.status || 'unknown';
        }

        return result as Record<Channel, 'opt_in' | 'opt_out' | 'unknown'>;
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TASKS
    // ═══════════════════════════════════════════════════════════════════════

    async listTasks(): Promise<CrmTask[]> {
        return fetchItems<CrmTask>('crm_tasks');
    },

    async upsertTask(task: CrmTask): Promise<void> {
        await updateItem('crm_tasks', task.id, task);
    },

    async setTaskStatus(id: string, status: CrmTask['status']): Promise<void> {
        await updateItem('crm_tasks', id, { status });
    },

    /**
     * Get overdue tasks (dueAt < now, still open).
     */
    async getOverdueTasks(): Promise<CrmTask[]> {
        const tasks = await fetchItems<CrmTask>('crm_tasks');
        const current = now();
        return tasks.filter(t => t.status === 'open' && t.dueAt < current);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CONTACTS & COMPANIES
    // ═══════════════════════════════════════════════════════════════════════

    async listContacts(): Promise<Contact[]> {
        return fetchItems<Contact>('crm_contacts');
    },

    async upsertContact(contact: Contact): Promise<void> {
        await updateItem('crm_contacts', contact.id, { ...contact, updatedAt: now() });
    },

    async listCompanies(): Promise<CompanyAccount[]> {
        return fetchItems<CompanyAccount>('crm_companies');
    },

    async upsertCompany(company: CompanyAccount): Promise<void> {
        await updateItem('crm_companies', company.id, { ...company, updatedAt: now() });
    },
};
