import { otaAdapter, OTAChannel, OTAReservationPayload } from './otaAdapter';
import { addItem, updateItem, fetchItems, subscribeToItems, getCollectionRef } from '../kernel/firestoreService';
import { Reservation } from '../../types';
import { db } from '../kernel/firebase';
import { query, where, getDocs, orderBy, limit, writeBatch, doc } from 'firebase/firestore';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RatePushRequest {
    channelId: string;
    roomTypeId: string;
    rateAmount: number;
    currency: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    ratePlanCode?: string;
}

export interface RatePushResult {
    channelId: string;
    success: boolean;
    error?: string;
    pushedAt: string;
}

export interface AvailabilitySyncRequest {
    roomTypeId: string;
    date: string;       // YYYY-MM-DD
    availableCount: number;
}

export interface RateParityIssue {
    roomTypeId: string;
    date: string;
    channelId: string;
    channelName: string;
    channelRate: number;
    pmsRate: number;
    variance: number;
    variancePercent: number;
}

export interface ChannelPerformanceMetrics {
    channelId: string;
    channelName: string;
    totalBookings: number;
    totalRevenue: number;
    avgRate: number;
    cancellationCount: number;
    cancellationRate: number;
    avgLeadTimeDays: number;
    lastSyncAt: string | null;
}

export interface BookingPullResult {
    channelId: string;
    newReservations: number;
    updatedReservations: number;
    errors: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();
const generateId = (prefix: string): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${prefix}_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// ─── Channel Manager ────────────────────────────────────────────────────────

class ChannelManager {
    private channels: OTAChannel[] = [];
    private listeners: ((channels: OTAChannel[]) => void)[] = [];
    private unsubscribeFirestore: (() => void) | null = null;

    constructor() {
        this.unsubscribeFirestore = subscribeToItems<OTAChannel>(
            'ota_connections',
            (fetchedChannels) => {
                this.channels = fetchedChannels;
                this.notify();
            }
        );
    }

    subscribe(listener: (channels: OTAChannel[]) => void) {
        this.listeners.push(listener);
        listener(this.channels);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l([...this.channels]));
    }

    async addConnection(channelData: Omit<OTAChannel, 'id'>) {
        console.log(`[ChannelManager] Adding new connection: ${channelData.name}`);
        await addItem('ota_connections', channelData);
    }

    async updateConnectionStatus(id: string, status: string, lastSync?: number) {
        const updateData: any = { status };
        if (lastSync) updateData.lastSync = lastSync;
        await updateItem('ota_connections', id, updateData);
    }

    getChannels() {
        return [...this.channels];
    }

    private getConnectedChannels(): OTAChannel[] {
        return this.channels.filter(c => c.status === 'Connected');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AVAILABILITY SYNC
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Push availability for a room type to all connected channels.
     */
    async syncAvailability(roomTypeId: string, count: number): Promise<void> {
        console.log(`[ChannelManager] Syncing availability for ${roomTypeId}: ${count}`);

        for (const channel of this.getConnectedChannels()) {
            await this.updateConnectionStatus(channel.id, 'Syncing');
            try {
                await otaAdapter.pushAvailability(channel.id, roomTypeId, count);
                await this.updateConnectionStatus(channel.id, 'Connected', Date.now());

                // Log the sync event
                await addItem('channel_sync_log', {
                    channelId: channel.id,
                    channelName: channel.name,
                    type: 'availability',
                    roomTypeId,
                    count,
                    status: 'success',
                    timestamp: now(),
                });
            } catch (error: any) {
                console.error(`[ChannelManager] Availability sync failed for ${channel.name}:`, error.message);
                await this.updateConnectionStatus(channel.id, 'Connected', Date.now());

                await addItem('channel_sync_log', {
                    channelId: channel.id,
                    channelName: channel.name,
                    type: 'availability',
                    roomTypeId,
                    count,
                    status: 'failed',
                    error: error.message,
                    timestamp: now(),
                });
            }
        }
    }

    /**
     * Bulk availability sync for multiple room types and dates.
     */
    async bulkSyncAvailability(requests: AvailabilitySyncRequest[]): Promise<{ synced: number; failed: number }> {
        let synced = 0;
        let failed = 0;

        for (const req of requests) {
            try {
                await this.syncAvailability(req.roomTypeId, req.availableCount);
                synced++;
            } catch {
                failed++;
            }
        }

        console.log(`[ChannelManager] Bulk availability sync: ${synced} synced, ${failed} failed`);
        return { synced, failed };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // OTA RATE PUSH
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Push a rate to a specific channel.
     */
    async pushRate(request: RatePushRequest): Promise<RatePushResult> {
        const channel = this.channels.find(c => c.id === request.channelId);
        if (!channel) {
            return { channelId: request.channelId, success: false, error: 'Channel not found', pushedAt: now() };
        }
        if (channel.status !== 'Connected') {
            return { channelId: request.channelId, success: false, error: `Channel status is ${channel.status}`, pushedAt: now() };
        }

        await this.updateConnectionStatus(channel.id, 'Syncing');

        try {
            // Simulate pushing rate to OTA API
            console.log(`[ChannelManager] Pushing rate to ${channel.name}: ${request.roomTypeId} @ ${request.currency} ${request.rateAmount} (${request.startDate} to ${request.endDate})`);
            await new Promise(resolve => setTimeout(resolve, 500));

            await this.updateConnectionStatus(channel.id, 'Connected', Date.now());

            // Persist rate push record for auditing
            await addItem('channel_rate_pushes', {
                ...request,
                channelName: channel.name,
                status: 'success',
                pushedAt: now(),
            });

            return { channelId: request.channelId, success: true, pushedAt: now() };
        } catch (error: any) {
            await this.updateConnectionStatus(channel.id, 'Connected');

            await addItem('channel_rate_pushes', {
                ...request,
                channelName: channel.name,
                status: 'failed',
                error: error.message,
                pushedAt: now(),
            });

            return { channelId: request.channelId, success: false, error: error.message, pushedAt: now() };
        }
    }

    /**
     * Push rates to ALL connected channels for a room type and date range.
     */
    async pushRateToAllChannels(
        roomTypeId: string,
        rateAmount: number,
        currency: string,
        startDate: string,
        endDate: string,
        ratePlanCode?: string
    ): Promise<RatePushResult[]> {
        const results: RatePushResult[] = [];

        for (const channel of this.getConnectedChannels()) {
            const result = await this.pushRate({
                channelId: channel.id,
                roomTypeId,
                rateAmount,
                currency,
                startDate,
                endDate,
                ratePlanCode,
            });
            results.push(result);
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`[ChannelManager] Rate push complete: ${successCount}/${results.length} channels succeeded`);
        return results;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RATE PARITY CHECK
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Check rate parity across channels for a given room type and date range.
     * Compares channel rates (from last push log) against the PMS base rate.
     */
    async checkRateParity(
        roomTypeId: string,
        pmsRate: number,
        tolerancePercent: number = 2
    ): Promise<{ issues: RateParityIssue[]; isParityOk: boolean }> {
        // Fetch most recent rate pushes per channel for this room type
        const pushLogs = await fetchItems<any>('channel_rate_pushes');
        const relevantPushes = pushLogs.filter((p: any) => p.roomTypeId === roomTypeId && p.status === 'success');

        // Group by channel, take the latest push per channel
        const latestByChannel = new Map<string, any>();
        for (const push of relevantPushes) {
            const existing = latestByChannel.get(push.channelId);
            if (!existing || push.pushedAt > existing.pushedAt) {
                latestByChannel.set(push.channelId, push);
            }
        }

        const issues: RateParityIssue[] = [];

        for (const [channelId, push] of latestByChannel) {
            const channelRate = push.rateAmount;
            const variance = channelRate - pmsRate;
            const variancePercent = pmsRate > 0 ? (Math.abs(variance) / pmsRate) * 100 : 0;

            if (variancePercent > tolerancePercent) {
                issues.push({
                    roomTypeId,
                    date: push.startDate,
                    channelId,
                    channelName: push.channelName || channelId,
                    channelRate,
                    pmsRate,
                    variance,
                    variancePercent: parseFloat(variancePercent.toFixed(2)),
                });
            }
        }

        if (issues.length > 0) {
            console.warn(`[ChannelManager] Rate parity issues found: ${issues.length} channels out of tolerance`);
        }

        return { issues, isParityOk: issues.length === 0 };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BOOKING PULL (Incoming Reservations)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Simulates an incoming webhook from an OTA.
     */
    async simulateIncomingReservation(payload: OTAReservationPayload) {
        console.log(`[ChannelManager] Incoming reservation from ${payload.channelId}`);

        const reservation = otaAdapter.translatePayloadToReservation(payload);
        await addItem('reservations', reservation);

        // Log the booking pull event
        await addItem('channel_booking_log', {
            channelId: payload.channelId,
            externalId: payload.externalId,
            reservationId: reservation.id,
            guestName: payload.guestName,
            action: 'new',
            timestamp: now(),
        });

        const channel = this.channels.find(
            c => c.id === payload.channelId || c.name.toLowerCase().includes(payload.channelId.toLowerCase())
        );
        if (channel) {
            await this.updateConnectionStatus(channel.id, channel.status, Date.now());
        }

        return reservation;
    }

    /**
     * Pull and process a batch of bookings from a specific channel.
     * In production this would call the OTA's reservation API; here we process
     * a supplied array of payloads.
     */
    async pullBookings(channelId: string, payloads: OTAReservationPayload[]): Promise<BookingPullResult> {
        let newReservations = 0;
        let updatedReservations = 0;
        let errors = 0;

        for (const payload of payloads) {
            try {
                // Check if reservation already exists by external ID
                const existing = await fetchItems<any>('reservations');
                const match = existing.find((r: any) => r.id === `res_ota_${payload.externalId}`);

                if (match) {
                    // Update existing reservation
                    const updated = otaAdapter.translatePayloadToReservation(payload);
                    await updateItem('reservations', match.id, {
                        checkIn: updated.checkIn,
                        checkOut: updated.checkOut,
                        rateApplied: updated.rateApplied,
                    });
                    updatedReservations++;

                    await addItem('channel_booking_log', {
                        channelId,
                        externalId: payload.externalId,
                        reservationId: match.id,
                        guestName: payload.guestName,
                        action: 'update',
                        timestamp: now(),
                    });
                } else {
                    // Create new reservation
                    await this.simulateIncomingReservation(payload);
                    newReservations++;
                }
            } catch (error: any) {
                console.error(`[ChannelManager] Error pulling booking ${payload.externalId}:`, error.message);
                errors++;
            }
        }

        console.log(`[ChannelManager] Booking pull from ${channelId}: ${newReservations} new, ${updatedReservations} updated, ${errors} errors`);
        return { channelId, newReservations, updatedReservations, errors };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHANNEL PERFORMANCE ANALYTICS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Calculate performance metrics for each connected channel.
     */
    async getChannelPerformance(): Promise<ChannelPerformanceMetrics[]> {
        const reservations = await fetchItems<any>('reservations');
        const metrics: ChannelPerformanceMetrics[] = [];

        for (const channel of this.channels) {
            // Find reservations sourced from this channel
            const channelReservations = reservations.filter(
                (r: any) => r.channel === channel.id || r.channel === channel.name.toLowerCase()
            );

            const confirmedOrCheckedIn = channelReservations.filter(
                (r: any) => !['Cancelled', 'CANCELLED'].includes(r.status)
            );
            const cancelled = channelReservations.filter(
                (r: any) => ['Cancelled', 'CANCELLED'].includes(r.status)
            );

            const totalRevenue = confirmedOrCheckedIn.reduce((sum: number, r: any) => {
                const checkIn = new Date(r.checkIn).getTime();
                const checkOut = new Date(r.checkOut).getTime();
                const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
                return sum + (r.rateApplied || 0) * nights;
            }, 0);

            const avgRate = confirmedOrCheckedIn.length > 0
                ? confirmedOrCheckedIn.reduce((sum: number, r: any) => sum + (r.rateApplied || 0), 0) / confirmedOrCheckedIn.length
                : 0;

            // Average lead time (days between booking creation and check-in)
            const leadTimes = confirmedOrCheckedIn
                .filter((r: any) => r.history && r.history[0]?.date)
                .map((r: any) => {
                    const bookedAt = new Date(r.history[0].date).getTime();
                    const checkIn = new Date(r.checkIn).getTime();
                    return Math.max(0, (checkIn - bookedAt) / (1000 * 60 * 60 * 24));
                });
            const avgLeadTimeDays = leadTimes.length > 0
                ? leadTimes.reduce((a: number, b: number) => a + b, 0) / leadTimes.length
                : 0;

            metrics.push({
                channelId: channel.id,
                channelName: channel.name,
                totalBookings: channelReservations.length,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                avgRate: parseFloat(avgRate.toFixed(2)),
                cancellationCount: cancelled.length,
                cancellationRate: channelReservations.length > 0
                    ? parseFloat(((cancelled.length / channelReservations.length) * 100).toFixed(1))
                    : 0,
                avgLeadTimeDays: parseFloat(avgLeadTimeDays.toFixed(1)),
                lastSyncAt: channel.lastSync ? new Date(channel.lastSync).toISOString() : null,
            });
        }

        return metrics;
    }

    /**
     * Get a summary of channel contribution to total revenue.
     */
    async getChannelMix(): Promise<{
        channels: { name: string; revenue: number; share: number; bookings: number }[];
        totalRevenue: number;
    }> {
        const performance = await this.getChannelPerformance();
        const totalRevenue = performance.reduce((sum, m) => sum + m.totalRevenue, 0);

        const channels = performance.map(m => ({
            name: m.channelName,
            revenue: m.totalRevenue,
            share: totalRevenue > 0 ? parseFloat(((m.totalRevenue / totalRevenue) * 100).toFixed(1)) : 0,
            bookings: m.totalBookings,
        }));

        return { channels, totalRevenue };
    }

    /**
     * Get sync history / audit log for a specific channel.
     */
    async getSyncHistory(channelId: string, maxEntries: number = 50): Promise<any[]> {
        try {
            const q = query(
                getCollectionRef('channel_sync_log'),
                where('channelId', '==', channelId),
                orderBy('timestamp', 'desc'),
                limit(maxEntries)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch {
            // Fallback: fetch all and filter
            const all = await fetchItems<any>('channel_sync_log');
            return all
                .filter((e: any) => e.channelId === channelId)
                .sort((a: any, b: any) => (b.timestamp || '').localeCompare(a.timestamp || ''))
                .slice(0, maxEntries);
        }
    }
}

export const channelManager = new ChannelManager();
export default ChannelManager;
