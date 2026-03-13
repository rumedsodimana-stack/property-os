"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateAutomationJob = exports.publishRecommendedRates = exports.syncDemandEvents = exports.fetchCompsetRates = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
const COMPS_API_BASE = process.env.COMPS_API_BASE || ((_a = functions.config().revenue) === null || _a === void 0 ? void 0 : _a.comps_base) || '';
const COMPS_API_KEY = process.env.COMPS_API_KEY || ((_b = functions.config().revenue) === null || _b === void 0 ? void 0 : _b.comps_key) || '';
const EVENT_API_BASE = process.env.EVENT_API_BASE || ((_c = functions.config().revenue) === null || _c === void 0 ? void 0 : _c.event_base) || '';
const EVENT_API_KEY = process.env.EVENT_API_KEY || ((_d = functions.config().revenue) === null || _d === void 0 ? void 0 : _d.event_key) || '';
const getOtaBase = (channel) => {
    var _a, _b;
    return channel === 'booking_com'
        ? process.env.BOOKING_COM_API_BASE || ((_a = functions.config().ota) === null || _a === void 0 ? void 0 : _a.booking_com_base) || ''
        : process.env.EXPEDIA_API_BASE || ((_b = functions.config().ota) === null || _b === void 0 ? void 0 : _b.expedia_base) || '';
};
const getOtaKey = (channel) => {
    var _a, _b;
    return channel === 'booking_com'
        ? process.env.BOOKING_COM_PARTNER_KEY || ((_a = functions.config().ota) === null || _a === void 0 ? void 0 : _a.booking_com_partner_key) || ''
        : process.env.EXPEDIA_PARTNER_KEY || ((_b = functions.config().ota) === null || _b === void 0 ? void 0 : _b.expedia_partner_key) || '';
};
const toDateId = (date) => date.toISOString().split('T')[0];
const fetchRatePlans = async (propertyId) => {
    const snap = await db.collection(`properties/${propertyId}/rate_plans`).get();
    return snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
};
const getBarRate = async (propertyId) => {
    var _a, _b;
    const plans = await fetchRatePlans(propertyId);
    const bar = plans.find((p) => p.code === 'BAR') || plans.find((p) => p.type === 'Base');
    return {
        amount: (bar === null || bar === void 0 ? void 0 : bar.baseRateAmount) || 150,
        currency: (bar === null || bar === void 0 ? void 0 : bar.currency) || 'USD',
        ratePlanId: (bar === null || bar === void 0 ? void 0 : bar.id) || ((_b = (_a = plans[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : 'rp_bar')
    };
};
const pullCompset = async (propertyId, targetDate) => {
    if (COMPS_API_BASE) {
        const resp = await (0, node_fetch_1.default)(`${COMPS_API_BASE}/rates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': COMPS_API_KEY
            },
            body: JSON.stringify({ propertyId, stayDate: targetDate })
        });
        if (resp.ok) {
            const body = await resp.json().catch(() => ({}));
            if (Array.isArray(body === null || body === void 0 ? void 0 : body.competitors))
                return body.competitors;
        }
        else {
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
const storeCompsetSnapshot = async (propertyId, targetDate, competitors) => {
    const rates = competitors.map((c) => c.rate || 0);
    const averageRate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
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
    return Object.assign({ id: ref.id }, snapshot);
};
const fetchEvents = async (propertyId) => {
    if (EVENT_API_BASE) {
        try {
            const resp = await (0, node_fetch_1.default)(`${EVENT_API_BASE}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': EVENT_API_KEY },
                body: JSON.stringify({ propertyId, days: 30 })
            });
            if (resp.ok) {
                const body = await resp.json().catch(() => ({}));
                if (Array.isArray(body === null || body === void 0 ? void 0 : body.events))
                    return body.events;
            }
        }
        catch (error) {
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
const computeOccupancyForDate = async (propertyId, targetDate) => {
    const roomsSnap = await db.collection(`properties/${propertyId}/rooms`).get();
    const roomCount = roomsSnap.size || 1;
    const resSnap = await db.collection(`properties/${propertyId}/reservations`).get();
    const occupancies = resSnap.docs.filter((doc) => {
        const d = doc.data();
        const checkIn = new Date(d.checkIn || d.checkin || targetDate);
        const checkOut = new Date(d.checkOut || d.checkout || targetDate);
        const tDate = new Date(targetDate);
        return (d.status === 'Confirmed' || d.status === 'Checked In') && checkIn <= tDate && tDate < checkOut;
    }).length;
    const occPct = Math.min(100, Math.round((occupancies / roomCount) * 100));
    return { occupancy: occPct, rooms: roomCount };
};
const demandImpactMultiplier = (events, targetDate) => {
    const hits = events.filter(e => e.date === targetDate);
    if (hits.length === 0)
        return { label: 'None', factor: 1 };
    const weights = hits.map(h => h.impact).join(', ');
    const factor = hits.some(h => h.impact === 'High') ? 1.15 : hits.some(h => h.impact === 'Medium') ? 1.08 : 1.04;
    return { label: weights, factor };
};
const buildRecommendation = async (propertyId, targetDate) => {
    var _a;
    const bar = await getBarRate(propertyId);
    const latestComps = await db.collection(`properties/${propertyId}/compset_snapshots`)
        .where('targetDate', '==', targetDate)
        .orderBy('capturedAt', 'desc')
        .limit(1)
        .get();
    const compset = (_a = latestComps.docs[0]) === null || _a === void 0 ? void 0 : _a.data();
    const eventsSnap = await db.collection(`properties/${propertyId}/demand_events`).get();
    const events = eventsSnap.docs.map(d => d.data());
    const { occupancy } = await computeOccupancyForDate(propertyId, targetDate);
    let recommended = bar.amount;
    const reasons = [];
    if (compset === null || compset === void 0 ? void 0 : compset.averageRate) {
        recommended = Math.max(recommended, compset.averageRate * 0.97);
        reasons.push(`Compset avg ${compset.averageRate}`);
    }
    if (occupancy >= 85) {
        recommended *= 1.12;
        reasons.push('Occupancy > 85%');
    }
    else if (occupancy <= 40) {
        recommended *= 0.9;
        reasons.push('Occupancy < 40%');
    }
    const demandImpact = demandImpactMultiplier(events, targetDate);
    recommended *= demandImpact.factor;
    if (demandImpact.label !== 'None')
        reasons.push(`Demand: ${demandImpact.label}`);
    recommended = Math.round(recommended * 100) / 100;
    return {
        baseRate: bar.amount,
        currency: bar.currency,
        ratePlanId: bar.ratePlanId,
        recommendedRate: recommended,
        compsetAverage: compset === null || compset === void 0 ? void 0 : compset.averageRate,
        occupancy,
        demandImpact: demandImpact.label,
        reasons
    };
};
const pushRatesToChannel = async (channel, propertyId, payload) => {
    const base = getOtaBase(channel);
    const key = getOtaKey(channel);
    if (!base || !key)
        throw new Error(`Missing ${channel} credentials`);
    const resp = await (0, node_fetch_1.default)(`${base}/rates/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ota-key': key },
        body: JSON.stringify(Object.assign({ propertyId }, payload))
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`OTA push failed (${channel}): ${resp.status} ${text}`);
    }
};
const recordRecommendation = async (propertyId, date, rec) => {
    const ref = db.collection(`properties/${propertyId}/rate_recommendations`).doc(`${date}`);
    await ref.set(Object.assign(Object.assign({ id: ref.id, date }, rec), { createdAt: firestore_1.FieldValue.serverTimestamp(), propertyId }), { merge: true });
};
const recordRatePush = async (propertyId, log) => {
    const ref = await db.collection(`properties/${propertyId}/rate_push_log`).add(Object.assign(Object.assign({}, log), { propertyId, runAt: firestore_1.FieldValue.serverTimestamp() }));
    return ref.id;
};
const ensureLosRestriction = async (propertyId, date, occupancy, demandImpact) => {
    if (occupancy < 85 && demandImpact === 'None')
        return;
    const ref = db.collection(`properties/${propertyId}/los_restrictions`).doc(date);
    await ref.set({
        id: date,
        dateStart: date,
        dateEnd: date,
        minNights: occupancy > 90 || demandImpact.includes('High') ? 3 : 2,
        reason: `Auto-set due to ${occupancy}% occ ${demandImpact}`,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        propertyId
    }, { merge: true });
};
exports.fetchCompsetRates = functions.https.onCall(async (data) => {
    const propertyId = String(data.propertyId || '').trim();
    const targetDate = data.targetDate || toDateId(new Date());
    if (!propertyId)
        throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
    const comps = await pullCompset(propertyId, targetDate);
    const snapshot = await storeCompsetSnapshot(propertyId, targetDate, comps);
    return snapshot;
});
exports.syncDemandEvents = functions.https.onCall(async (data) => {
    const propertyId = String(data.propertyId || '').trim();
    if (!propertyId)
        throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
    const events = await fetchEvents(propertyId);
    for (const evt of events) {
        await db.collection(`properties/${propertyId}/demand_events`).doc(evt.id || `${evt.name}_${evt.date}`).set(Object.assign(Object.assign({}, evt), { propertyId }), { merge: true });
    }
    return { count: events.length };
});
exports.publishRecommendedRates = functions.https.onCall(async (data) => {
    const propertyId = String(data.propertyId || '').trim();
    const channels = (data.channels || ['booking_com', 'expedia']);
    const horizon = Number(data.horizon || 14);
    if (!propertyId)
        throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
    const result = await executePublishRecommendedRates(propertyId, channels, horizon);
    return result;
});
const executePublishRecommendedRates = async (propertyId, channels, horizon) => {
    const today = new Date();
    const logEntries = [];
    for (let i = 0; i < horizon; i++) {
        const target = new Date(today);
        target.setDate(today.getDate() + i);
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
            }
            catch (error) {
                logEntries.push({ targetDate: dateStr, channel, status: 'failed', message: error.message });
            }
        }
    }
    await recordRatePush(propertyId, { channels, status: 'sent', details: logEntries });
    return { status: 'ok', logEntries };
};
const isAutoPushEnabled = async (propertyId) => {
    var _a;
    const doc = await db.collection(`properties/${propertyId}/revenue_settings`).doc('automation').get();
    return doc.exists ? !!((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.autoPushEnabled) : true;
};
exports.rateAutomationJob = functions.pubsub.schedule('every 30 minutes').onRun(async () => {
    const properties = await db.collection('properties').listDocuments();
    for (const prop of properties) {
        if (!(await isAutoPushEnabled(prop.id)))
            continue;
        await executePublishRecommendedRates(prop.id, ['booking_com', 'expedia'], 7);
    }
    return null;
});
//# sourceMappingURL=revenue.js.map