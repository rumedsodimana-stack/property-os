import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

const COMPS_API_BASE = process.env.COMPS_API_BASE || functions.config().revenue?.comps_base || '';
const COMPS_API_KEY = process.env.COMPS_API_KEY || functions.config().revenue?.comps_key || '';
const EVENT_API_BASE = process.env.EVENT_API_BASE || functions.config().revenue?.event_base || '';
const EVENT_API_KEY = process.env.EVENT_API_KEY || functions.config().revenue?.event_key || '';

const getOtaBase = (channel: 'booking_com' | 'expedia') =>
    channel === 'booking_com'
        ? process.env.BOOKING_COM_API_BASE || functions.config().ota?.booking_com_base || ''
        : process.env.EXPEDIA_API_BASE || functions.config().ota?.expedia_base || '';

const getOtaKey = (channel: 'booking_com' | 'expedia') =>
    channel === 'booking_com'
        ? process.env.BOOKING_COM_PARTNER_KEY || functions.config().ota?.booking_com_partner_key || ''
        : process.env.EXPEDIA_PARTNER_KEY || functions.config().ota?.expedia_partner_key || '';

const toDateId = (date: Date) => date.toISOString().split('T')[0];

const fetchRatePlans = async (propertyId: string) => {
    const snap = await db.collection(`properties/${propertyId}/rate_plans`).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
};

const getBarRate = async (propertyId: string): Promise<{ amount: number; currency: string; ratePlanId: string }> => {
    const plans = await fetchRatePlans(propertyId);
    const bar = plans.find((p: any) => p.code === 'BAR') || plans.find((p: any) => p.type === 'Base');
    return {
        amount: bar?.baseRateAmount || 150,
        currency: bar?.currency || 'USD',
        ratePlanId: bar?.id || (plans[0]?.id ?? 'rp_bar')
    };
};

const pullCompset = async (propertyId: string, targetDate: string) => {
    if (COMPS_API_BASE) {
        const resp = await fetch(`${COMPS_API_BASE}/rates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': COMPS_API_KEY
            },
            body: JSON.stringify({ propertyId, stayDate: targetDate })
        });
        if (resp.ok) {
            const body: any = await resp.json().catch(() => ({} as any));
            if (Array.isArray(body?.competitors)) return body.competitors as any[];
        } else {
            functions.logger.error('[Revenue] compset provider failed', resp.status);
        }
    }

    // Fallback synthetic compset
    return [
        { competitorId: 'comp_1', name: 'City Towers', channel: 'booking_com', rate: 182, currency: 'USD', stayDate: targetDate, lastScraped: Date.now() },
        { competitorId: 'comp_2', name: 'Harbor Suites', channel: 'expedia', rate: 205, currency: 'USD', stayDate: targetDate, lastScraped: Date.now() },
        { competitorId: 'comp_3', name: 'Metro Lodge', channel: 'direct', rate: 165, currency: 'USD', stayDate: targetDate, lastScraped: Date.now() },
    ];
};

const storeCompsetSnapshot = async (propertyId: string, targetDate: string, competitors: any[]) => {
    const rates = competitors.map((c: any) => c.rate || 0);
    const averageRate = rates.length ? rates.reduce((a: number, b: number) => a + b, 0) / rates.length : 0;
    const snapshot = {
        targetDate,
        capturedAt: Date.now(),
        averageRate,
        minRate: Math.min(...rates),
        maxRate: Math.max(...rates),
        source: COMPS_API_BASE ? 'provider' : 'synthetic',
        competitors,
        propertyId
    };
    const ref = await db.collection(`properties/${propertyId}/compset_snapshots`).add(snapshot);
    return { id: ref.id, ...snapshot };
};

const fetchEvents = async (propertyId: string) => {
    if (EVENT_API_BASE) {
        try {
            const resp = await fetch(`${EVENT_API_BASE}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': EVENT_API_KEY },
                body: JSON.stringify({ propertyId, days: 30 })
            });
            if (resp.ok) {
                const body: any = await resp.json().catch(() => ({} as any));
                if (Array.isArray(body?.events)) return body.events as any[];
            }
        } catch (error: any) {
            functions.logger.error('[Revenue] event provider error', error);
        }
    }

    // Synthetic demand events
    const today = new Date();
    return [
        { id: 'evt_conf', name: 'Tech Expo', date: toDateId(new Date(today.getTime() + 7 * 86400000)), impact: 'High', category: 'Conference', source: 'synthetic', expectedAttendance: 3500 },
        { id: 'evt_sport', name: 'City Derby', date: toDateId(new Date(today.getTime() + 10 * 86400000)), impact: 'Medium', category: 'Sports', source: 'synthetic', expectedAttendance: 18000 },
        { id: 'evt_concert', name: 'Arena Concert', date: toDateId(new Date(today.getTime() + 14 * 86400000)), impact: 'Low', category: 'Entertainment', source: 'synthetic', expectedAttendance: 9000 },
    ];
};

const computeOccupancyForDate = async (propertyId: string, targetDate: string) => {
    const roomsSnap = await db.collection(`properties/${propertyId}/rooms`).get();
    const roomCount = roomsSnap.size || 1;
    const resSnap = await db.collection(`properties/${propertyId}/reservations`).get();
    const occupancies = resSnap.docs.filter((doc) => {
        const d = doc.data() as any;
        const checkIn = new Date(d.checkIn || d.checkin || targetDate);
        const checkOut = new Date(d.checkOut || d.checkout || targetDate);
        const tDate = new Date(targetDate);
        return (d.status === 'Confirmed' || d.status === 'Checked In') && checkIn <= tDate && tDate < checkOut;
    }).length;
    const occPct = Math.min(100, Math.round((occupancies / roomCount) * 100));
    return { occupancy: occPct, rooms: roomCount };
};

const demandImpactMultiplier = (events: any[], targetDate: string): { label: string; factor: number } => {
    const hits = events.filter(e => e.date === targetDate);
    if (hits.length === 0) return { label: 'None', factor: 1 };
    const weights = hits.map(h => h.impact).join(', ');
    const factor = hits.some(h => h.impact === 'High') ? 1.15 : hits.some(h => h.impact === 'Medium') ? 1.08 : 1.04;
    return { label: weights, factor };
};

const buildRecommendation = async (propertyId: string, targetDate: string) => {
    const bar = await getBarRate(propertyId);
    const latestComps = await db.collection(`properties/${propertyId}/compset_snapshots`)
        .where('targetDate', '==', targetDate)
        .orderBy('capturedAt', 'desc')
        .limit(1)
        .get();
    const compset = latestComps.docs[0]?.data() as any | undefined;
    const eventsSnap = await db.collection(`properties/${propertyId}/demand_events`).get();
    const events = eventsSnap.docs.map(d => d.data());
    const { occupancy } = await computeOccupancyForDate(propertyId, targetDate);

    let recommended = bar.amount;
    const reasons: string[] = [];

    if (compset?.averageRate) {
        recommended = Math.max(recommended, compset.averageRate * 0.97);
        reasons.push(`Compset avg ${compset.averageRate}`);
    }

    if (occupancy >= 85) {
        recommended *= 1.12;
        reasons.push('Occupancy > 85%');
    } else if (occupancy <= 40) {
        recommended *= 0.9;
        reasons.push('Occupancy < 40%');
    }

    const demandImpact = demandImpactMultiplier(events, targetDate);
    recommended *= demandImpact.factor;
    if (demandImpact.label !== 'None') reasons.push(`Demand: ${demandImpact.label}`);

    recommended = Math.round(recommended * 100) / 100;

    return {
        baseRate: bar.amount,
        currency: bar.currency,
        ratePlanId: bar.ratePlanId,
        recommendedRate: recommended,
        compsetAverage: compset?.averageRate,
        occupancy,
        demandImpact: demandImpact.label,
        reasons
    };
};

const pushRatesToChannel = async (channel: 'booking_com' | 'expedia', propertyId: string, payload: any) => {
    const base = getOtaBase(channel);
    const key = getOtaKey(channel);
    if (!base || !key) throw new Error(`Missing ${channel} credentials`);
    const resp = await fetch(`${base}/rates/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ota-key': key },
        body: JSON.stringify({ propertyId, ...payload })
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`OTA push failed (${channel}): ${resp.status} ${text}`);
    }
};

const recordRecommendation = async (propertyId: string, date: string, rec: any) => {
    const ref = db.collection(`properties/${propertyId}/rate_recommendations`).doc(`${date}`);
    await ref.set({
        id: ref.id,
        date,
        ...rec,
        createdAt: FieldValue.serverTimestamp(),
        propertyId
    }, { merge: true });
};

const recordRatePush = async (propertyId: string, log: any) => {
    const ref = await db.collection(`properties/${propertyId}/rate_push_log`).add({
        ...log,
        propertyId,
        runAt: FieldValue.serverTimestamp()
    });
    return ref.id;
};

const ensureLosRestriction = async (propertyId: string, date: string, occupancy: number, demandImpact: string) => {
    if (occupancy < 85 && demandImpact === 'None') return;
    const ref = db.collection(`properties/${propertyId}/los_restrictions`).doc(date);
    await ref.set({
        id: date,
        dateStart: date,
        dateEnd: date,
        minNights: occupancy > 90 || demandImpact.includes('High') ? 3 : 2,
        reason: `Auto-set due to ${occupancy}% occ ${demandImpact}`,
        createdAt: FieldValue.serverTimestamp(),
        propertyId
    }, { merge: true });
};

export const fetchCompsetRates = functions.https.onCall(async (data) => {
    const propertyId = String(data.propertyId || '').trim();
    const targetDate = data.targetDate || toDateId(new Date());
    if (!propertyId) throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
    const comps = await pullCompset(propertyId, targetDate);
    const snapshot = await storeCompsetSnapshot(propertyId, targetDate, comps);
    return snapshot;
});

export const syncDemandEvents = functions.https.onCall(async (data) => {
    const propertyId = String(data.propertyId || '').trim();
    if (!propertyId) throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
    const events = await fetchEvents(propertyId);
    for (const evt of events) {
        await db.collection(`properties/${propertyId}/demand_events`).doc(evt.id || `${evt.name}_${evt.date}`).set({
            ...evt,
            propertyId
        }, { merge: true });
    }
    return { count: events.length };
});

export const publishRecommendedRates = functions.https.onCall(async (data) => {
    const propertyId = String(data.propertyId || '').trim();
    const channels = (data.channels || ['booking_com', 'expedia']) as Array<'booking_com' | 'expedia'>;
    const horizon = Number(data.horizon || 14);
    if (!propertyId) throw new functions.https.HttpsError('invalid-argument', 'propertyId required');

    const result = await executePublishRecommendedRates(propertyId, channels, horizon);
    return result;
});

const executePublishRecommendedRates = async (propertyId: string, channels: Array<'booking_com' | 'expedia'>, horizon: number) => {
    const today = new Date();
    const logEntries: any[] = [];

    for (let i = 0; i < horizon; i++) {
        const target = new Date(today); target.setDate(today.getDate() + i);
        const dateStr = toDateId(target);
        const rec = await buildRecommendation(propertyId, dateStr);
        await recordRecommendation(propertyId, dateStr, rec);
        await ensureLosRestriction(propertyId, dateStr, rec.occupancy, rec.demandImpact);

        for (const channel of channels) {
            try {
                await pushRatesToChannel(channel, propertyId, {
                    rates: [{ ratePlanId: rec.ratePlanId, date: dateStr, amount: rec.recommendedRate, currency: rec.currency }]
                });
                logEntries.push({ targetDate: dateStr, channel, status: 'sent' });
            } catch (error: any) {
                logEntries.push({ targetDate: dateStr, channel, status: 'failed', message: error.message });
            }
        }
    }

    await recordRatePush(propertyId, { channels, status: 'sent', details: logEntries });
    return { status: 'ok', logEntries };
};

const isAutoPushEnabled = async (propertyId: string) => {
    const doc = await db.collection(`properties/${propertyId}/revenue_settings`).doc('automation').get();
    return doc.exists ? !!doc.data()?.autoPushEnabled : true;
};

export const rateAutomationJob = functions.pubsub.schedule('every 30 minutes').onRun(async () => {
    const properties = await db.collection('properties').listDocuments();
    for (const prop of properties) {
        if (!(await isAutoPushEnabled(prop.id))) continue;
        await executePublishRecommendedRates(prop.id, ['booking_com', 'expedia'], 7);
    }
    return null;
});
