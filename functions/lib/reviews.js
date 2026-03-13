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
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", { value: true });
exports.postStaySurveyJob = exports.reviewSyncJob = exports.syncReviews = exports.draftReviewResponse = exports.ingestReviewWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
const REVIEW_API_KEY = process.env.REVIEW_API_KEY || ((_a = functions.config().reviews) === null || _a === void 0 ? void 0 : _a.api_key) || '';
const SENTIMENT_API = process.env.SENTIMENT_API || ((_b = functions.config().reviews) === null || _b === void 0 ? void 0 : _b.sentiment_api) || '';
const REVIEW_PROXY_BASE = process.env.REVIEW_PROXY_BASE || ((_c = functions.config().reviews) === null || _c === void 0 ? void 0 : _c.proxy_base) || '';
const REVIEW_PROXY_KEY = process.env.REVIEW_PROXY_KEY || ((_d = functions.config().reviews) === null || _d === void 0 ? void 0 : _d.proxy_key) || '';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || ((_e = functions.config().twilio) === null || _e === void 0 ? void 0 : _e.sid) || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || ((_f = functions.config().twilio) === null || _f === void 0 ? void 0 : _f.token) || '';
const TWILIO_FROM = process.env.TWILIO_FROM || ((_g = functions.config().twilio) === null || _g === void 0 ? void 0 : _g.from) || '';
const SENDGRID_KEY = process.env.SENDGRID_KEY || ((_h = functions.config().sendgrid) === null || _h === void 0 ? void 0 : _h.key) || '';
const SENDGRID_FROM = process.env.SENDGRID_FROM || ((_j = functions.config().sendgrid) === null || _j === void 0 ? void 0 : _j.from) || '';
let twilioClient = null;
const getTwilio = () => {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN)
        return null;
    if (!twilioClient) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilio = require('twilio');
        twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    }
    return twilioClient;
};
let sendgridClient = null;
const getSendGrid = () => {
    if (!SENDGRID_KEY)
        return null;
    if (!sendgridClient) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(SENDGRID_KEY);
        sendgridClient = sgMail;
    }
    return sendgridClient;
};
const toMillis = (value) => {
    if (!value)
        return Date.now();
    if (typeof value === 'number')
        return value;
    if (value instanceof Date)
        return value.getTime();
    if (value instanceof firestore_1.Timestamp)
        return value.toMillis();
    if (typeof value.toDate === 'function')
        return value.toDate().getTime();
    const parsed = Date.parse(String(value));
    return Number.isFinite(parsed) ? parsed : Date.now();
};
const detectSentiment = async (text) => {
    if (!SENTIMENT_API)
        return null;
    const resp = await (0, node_fetch_1.default)(SENTIMENT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': REVIEW_API_KEY },
        body: JSON.stringify({ text })
    });
    if (!resp.ok)
        return null;
    const body = await resp.json().catch(() => null);
    return typeof (body === null || body === void 0 ? void 0 : body.sentiment) === 'number' ? body.sentiment : null;
};
const updateReviewStats = async (propertyId, source, rating) => {
    const summaryRef = db.collection(`properties/${propertyId}/review_stats`).doc('summary');
    const dayKey = new Date().toISOString().slice(0, 10);
    await summaryRef.set({
        total: firestore_1.FieldValue.increment(1),
        [`sources.${source}.count`]: firestore_1.FieldValue.increment(1),
        [`sources.${source}.ratingSum`]: firestore_1.FieldValue.increment(rating),
        lastReviewAt: firestore_1.FieldValue.serverTimestamp(),
        [`daily.${dayKey}`]: firestore_1.FieldValue.increment(1)
    }, { merge: true });
};
const storeReview = async (propertyId, input) => {
    const sentiment = typeof input.sentiment === 'number' ? input.sentiment : await detectSentiment(input.body || '');
    const payload = Object.assign(Object.assign({}, input), { sentiment,
        propertyId, createdAt: input.createdAt ? new Date(toMillis(input.createdAt)) : firestore_1.FieldValue.serverTimestamp() });
    const docId = input.externalId ? `${input.source}_${input.externalId}` : undefined;
    if (docId) {
        await db.collection(`properties/${propertyId}/reviews`).doc(docId).set(payload, { merge: true });
    }
    else {
        await db.collection(`properties/${propertyId}/reviews`).add(payload);
    }
    await updateReviewStats(propertyId, String(input.source), input.rating || 0);
};
const pullFromChannel = async (propertyId, cfg, sinceMs) => {
    const source = cfg.source;
    const endpoint = cfg.endpoint || (REVIEW_PROXY_BASE ? `${REVIEW_PROXY_BASE}/${source}` : '');
    if (!endpoint)
        throw new Error(`No endpoint configured for ${source}`);
    const headers = { 'Content-Type': 'application/json' };
    const apiKey = cfg.apiKey || REVIEW_PROXY_KEY || REVIEW_API_KEY;
    if (apiKey)
        headers['x-api-key'] = apiKey;
    const body = {
        propertyId,
        locationId: cfg.locationId || cfg.placeId || cfg.hotelId,
        since: sinceMs ? new Date(sinceMs).toISOString() : undefined
    };
    const resp = await (0, node_fetch_1.default)(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Provider ${source} failed: ${resp.status} ${text}`);
    }
    const payload = await resp.json().catch(() => ({}));
    return (payload.reviews || payload.data || []);
};
const syncPropertyReviews = async (propertyId) => {
    const channelSnap = await db.collection(`properties/${propertyId}/review_channels`).get();
    const channels = channelSnap.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
    // Fallback: if no channel docs but proxy base configured, pull generic
    if (channels.length === 0 && REVIEW_PROXY_BASE) {
        channels.push({ id: 'proxy', source: 'ota', endpoint: `${REVIEW_PROXY_BASE}/aggregate` });
    }
    const results = [];
    for (const channel of channels) {
        if (channel.enabled === false)
            continue;
        const sinceMs = channel.lastSyncedAt ? toMillis(channel.lastSyncedAt) : undefined;
        try {
            const reviews = await pullFromChannel(propertyId, channel, sinceMs);
            let inserted = 0;
            for (const review of reviews) {
                await storeReview(propertyId, Object.assign(Object.assign({}, review), { source: review.source || channel.source }));
                inserted += 1;
            }
            await db.collection(`properties/${propertyId}/review_channels`).doc(channel.id).set({
                lastSyncedAt: firestore_1.FieldValue.serverTimestamp(),
                lastStatus: 'ok',
                lastCount: inserted
            }, { merge: true });
            results.push({ source: channel.source, inserted });
        }
        catch (error) {
            functions.logger.error('[Reviews] sync failed', { propertyId, source: channel.source, error: error.message });
            await db.collection(`properties/${propertyId}/review_channels`).doc(channel.id).set({
                lastSyncedAt: firestore_1.FieldValue.serverTimestamp(),
                lastStatus: 'failed',
                lastError: error.message
            }, { merge: true });
            results.push({ source: channel.source, inserted: 0, error: error.message });
        }
    }
    return results;
};
const sendSms = async (to, body) => {
    const twilio = getTwilio();
    if (!twilio || !TWILIO_FROM)
        throw new Error('Twilio not configured');
    await twilio.messages.create({ to, from: TWILIO_FROM, body });
};
const sendEmail = async (to, subject, body) => {
    const sg = getSendGrid();
    if (!sg || !SENDGRID_FROM)
        throw new Error('SendGrid not configured');
    await sg.send({ to, from: SENDGRID_FROM, subject, text: body, html: `<pre>${body}</pre>` });
};
const buildSurveyLink = (propertyId, reservationId) => {
    var _a;
    const base = process.env.REVIEW_SURVEY_BASE || ((_a = functions.config().reviews) === null || _a === void 0 ? void 0 : _a.survey_base) || 'https://survey.hotel-singu.com/review';
    return `${base}?propertyId=${encodeURIComponent(propertyId)}&reservationId=${encodeURIComponent(reservationId)}`;
};
const sendPostStaySurvey = async (propertyId, reservation, propertyName) => {
    var _a;
    const data = reservation.data() || {};
    if (data.postSurveySent)
        return;
    const checkout = data.checkOut ? toMillis(data.checkOut) : 0;
    const now = Date.now();
    if (!checkout || (now - checkout) > (72 * 60 * 60 * 1000))
        return; // within 72h of checkout
    const guestId = data.guestId || ((_a = data.guest) === null || _a === void 0 ? void 0 : _a.id);
    let guest = null;
    if (guestId) {
        const g = await db.collection(`properties/${propertyId}/guests`).doc(guestId).get();
        guest = g.exists ? g.data() : null;
    }
    const email = data.guestEmail || (guest === null || guest === void 0 ? void 0 : guest.email);
    const phone = data.guestPhone || (guest === null || guest === void 0 ? void 0 : guest.phone);
    if (!email && !phone)
        return;
    const surveyLink = buildSurveyLink(propertyId, reservation.id);
    const message = `Thank you for staying at ${propertyName}. We’d love your feedback: ${surveyLink}`;
    try {
        if (phone)
            await sendSms(phone, message);
        else if (email)
            await sendEmail(email, `${propertyName} • Post-stay survey`, message);
        await reservation.ref.set({
            postSurveySent: true,
            postSurveySentAt: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
        await db.collection(`properties/${propertyId}/post_stay_surveys`).add({
            reservationId: reservation.id,
            guestId,
            channel: phone ? 'sms' : 'email',
            message,
            sentAt: firestore_1.FieldValue.serverTimestamp()
        });
    }
    catch (error) {
        functions.logger.error('[Reviews] survey send failed', { propertyId, reservationId: reservation.id, error: error.message });
    }
};
exports.ingestReviewWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
    try {
        const propertyId = String(req.query.propertyId || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.propertyId) || '').trim();
        if (!propertyId)
            throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
        const payload = req.body;
        const reviewPayload = {
            source: payload.source || 'ota',
            body: payload.body || '',
            rating: Number(payload.rating || 0),
            reviewerName: payload.reviewerName,
            title: payload.title,
            stayDate: payload.stayDate,
            externalId: payload.externalId,
            createdAt: payload.createdAt || Date.now(),
            sentiment: payload.sentiment
        };
        await storeReview(propertyId, Object.assign(Object.assign({}, reviewPayload), { source: reviewPayload.source || 'ota', createdAt: reviewPayload.createdAt || Date.now() }));
        res.status(200).json({ status: 'ok' });
    }
    catch (error) {
        functions.logger.error('[Reviews] ingest failed', error);
        res.status(400).json({ error: error.message || 'failed' });
    }
});
const callAiDraft = async (prompt) => {
    var _a, _b, _c, _d, _e;
    const OPENAI_KEY = process.env.OPENAI_API_KEY || ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key);
    if (!OPENAI_KEY)
        return null;
    try {
        const resp = await (0, node_fetch_1.default)('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.REVIEW_MODEL || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a hotel GM crafting concise, gracious review replies. Be brief (<=90 words), empathetic, and action oriented.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.4,
                max_tokens: 180
            })
        });
        if (!resp.ok) {
            const text = await resp.text();
            functions.logger.error('[Reviews] AI draft failed', resp.status, text);
            return null;
        }
        const body = await resp.json();
        return ((_e = (_d = (_c = (_b = body.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) === null || _e === void 0 ? void 0 : _e.trim()) || null;
    }
    catch (error) {
        functions.logger.error('[Reviews] AI draft exception', error);
        return null;
    }
};
exports.draftReviewResponse = functions.https.onCall(async (data) => {
    const { propertyId, reviewId, reviewBody, rating, guestName } = data;
    if (!propertyId || !reviewId || !reviewBody) {
        throw new functions.https.HttpsError('invalid-argument', 'propertyId, reviewId, reviewBody required');
    }
    const prompt = [
        `Write a concise, gracious reply to a hotel review.`,
        `Rating: ${rating !== null && rating !== void 0 ? rating : 'N/A'}`,
        `Guest: ${guestName || 'Guest'}`,
        `Review: ${reviewBody}`,
        `Tone: empathetic, proactive, brief (<=90 words).`
    ].join('\n');
    const sentiment = await detectSentiment(reviewBody);
    const aiDraft = await callAiDraft(prompt);
    const draft = aiDraft || `Thank you for your feedback. We appreciate your ${rating || ''} star review and will address your notes promptly.`;
    await db.collection(`properties/${propertyId}/review_responses`).add({
        reviewId,
        draft,
        sentiment,
        createdAt: firestore_1.FieldValue.serverTimestamp()
    });
    return { draft, sentiment };
});
exports.syncReviews = functions.https.onCall(async (data) => {
    const propertyId = String(data.propertyId || '').trim();
    if (!propertyId)
        throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
    const results = await syncPropertyReviews(propertyId);
    return { results };
});
exports.reviewSyncJob = functions.pubsub.schedule('every 6 hours').onRun(async () => {
    const properties = await db.collection('properties').listDocuments();
    for (const prop of properties) {
        await syncPropertyReviews(prop.id);
    }
    return null;
});
exports.postStaySurveyJob = functions.pubsub.schedule('every 3 hours').onRun(async () => {
    var _a;
    const properties = await db.collection('properties').listDocuments();
    for (const prop of properties) {
        const propertySnap = await prop.get();
        const propertyName = ((_a = propertySnap.data()) === null || _a === void 0 ? void 0 : _a.name) || 'Our Hotel';
        const reservations = await db.collection(`properties/${prop.id}/reservations`)
            .where('status', '==', 'Checked Out')
            .get();
        for (const res of reservations.docs) {
            await sendPostStaySurvey(prop.id, res, propertyName);
        }
    }
    return null;
});
//# sourceMappingURL=reviews.js.map