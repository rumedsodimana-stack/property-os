import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

const REVIEW_API_KEY = process.env.REVIEW_API_KEY || functions.config().reviews?.api_key || '';
const SENTIMENT_API = process.env.SENTIMENT_API || functions.config().reviews?.sentiment_api || '';
const REVIEW_PROXY_BASE = process.env.REVIEW_PROXY_BASE || functions.config().reviews?.proxy_base || '';
const REVIEW_PROXY_KEY = process.env.REVIEW_PROXY_KEY || functions.config().reviews?.proxy_key || '';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || functions.config().twilio?.sid || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || functions.config().twilio?.token || '';
const TWILIO_FROM = process.env.TWILIO_FROM || functions.config().twilio?.from || '';
const SENDGRID_KEY = process.env.SENDGRID_KEY || functions.config().sendgrid?.key || '';
const SENDGRID_FROM = process.env.SENDGRID_FROM || functions.config().sendgrid?.from || '';

let twilioClient: any = null;
const getTwilio = () => {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
    if (!twilioClient) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilio = require('twilio');
        twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    }
    return twilioClient;
};

let sendgridClient: any = null;
const getSendGrid = () => {
    if (!SENDGRID_KEY) return null;
    if (!sendgridClient) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(SENDGRID_KEY);
        sendgridClient = sgMail;
    }
    return sendgridClient;
};

const toMillis = (value: any): number => {
    if (!value) return Date.now();
    if (typeof value === 'number') return value;
    if (value instanceof Date) return value.getTime();
    if (value instanceof Timestamp) return value.toMillis();
    if (typeof value.toDate === 'function') return (value as any).toDate().getTime();
    const parsed = Date.parse(String(value));
    return Number.isFinite(parsed) ? parsed : Date.now();
};

type ReviewSource = 'google' | 'tripadvisor' | 'booking_com' | 'expedia' | 'ota';
type ReviewInput = {
    source: ReviewSource | string;
    body: string;
    rating: number;
    reviewerName?: string;
    title?: string;
    stayDate?: string;
    externalId?: string;
    createdAt?: number | Date | Timestamp;
    sentiment?: number | null;
};

const detectSentiment = async (text: string): Promise<number | null> => {
    if (!SENTIMENT_API) return null;
    const resp = await fetch(SENTIMENT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': REVIEW_API_KEY },
        body: JSON.stringify({ text })
    });
    if (!resp.ok) return null;
    const body: any = await resp.json().catch(() => null);
    return typeof body?.sentiment === 'number' ? body.sentiment : null;
};

const updateReviewStats = async (propertyId: string, source: string, rating: number) => {
    const summaryRef = db.collection(`properties/${propertyId}/review_stats`).doc('summary');
    const dayKey = new Date().toISOString().slice(0, 10);
    await summaryRef.set({
        total: FieldValue.increment(1),
        [`sources.${source}.count`]: FieldValue.increment(1),
        [`sources.${source}.ratingSum`]: FieldValue.increment(rating),
        lastReviewAt: FieldValue.serverTimestamp(),
        [`daily.${dayKey}`]: FieldValue.increment(1)
    }, { merge: true });
};

const storeReview = async (propertyId: string, input: ReviewInput) => {
    const sentiment = typeof input.sentiment === 'number' ? input.sentiment : await detectSentiment(input.body || '');
    const payload = {
        ...input,
        sentiment,
        propertyId,
        createdAt: input.createdAt ? new Date(toMillis(input.createdAt)) : FieldValue.serverTimestamp(),
    };
    const docId = input.externalId ? `${input.source}_${input.externalId}` : undefined;
    if (docId) {
        await db.collection(`properties/${propertyId}/reviews`).doc(docId).set(payload, { merge: true });
    } else {
        await db.collection(`properties/${propertyId}/reviews`).add(payload);
    }
    await updateReviewStats(propertyId, String(input.source), input.rating || 0);
};

const pullFromChannel = async (propertyId: string, cfg: any, sinceMs?: number): Promise<ReviewInput[]> => {
    const source = cfg.source as string;
    const endpoint = cfg.endpoint || (REVIEW_PROXY_BASE ? `${REVIEW_PROXY_BASE}/${source}` : '');
    if (!endpoint) throw new Error(`No endpoint configured for ${source}`);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = cfg.apiKey || REVIEW_PROXY_KEY || REVIEW_API_KEY;
    if (apiKey) headers['x-api-key'] = apiKey;

    const body = {
        propertyId,
        locationId: cfg.locationId || cfg.placeId || cfg.hotelId,
        since: sinceMs ? new Date(sinceMs).toISOString() : undefined
    };

    const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Provider ${source} failed: ${resp.status} ${text}`);
    }
    const payload: any = await resp.json().catch(() => ({} as any));
    return (payload.reviews || payload.data || []) as ReviewInput[];
};

const syncPropertyReviews = async (propertyId: string) => {
    const channelSnap = await db.collection(`properties/${propertyId}/review_channels`).get();
    const channels = channelSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    // Fallback: if no channel docs but proxy base configured, pull generic
    if (channels.length === 0 && REVIEW_PROXY_BASE) {
        channels.push({ id: 'proxy', source: 'ota', endpoint: `${REVIEW_PROXY_BASE}/aggregate` });
    }

    const results: Array<{ source: string; inserted: number; error?: string }> = [];

    for (const channel of channels) {
        if (channel.enabled === false) continue;
        const sinceMs = channel.lastSyncedAt ? toMillis(channel.lastSyncedAt) : undefined;
        try {
            const reviews = await pullFromChannel(propertyId, channel, sinceMs);
            let inserted = 0;
            for (const review of reviews) {
                await storeReview(propertyId, { ...review, source: review.source || channel.source });
                inserted += 1;
            }
            await db.collection(`properties/${propertyId}/review_channels`).doc(channel.id).set({
                lastSyncedAt: FieldValue.serverTimestamp(),
                lastStatus: 'ok',
                lastCount: inserted
            }, { merge: true });
            results.push({ source: channel.source, inserted });
        } catch (error: any) {
            functions.logger.error('[Reviews] sync failed', { propertyId, source: channel.source, error: error.message });
            await db.collection(`properties/${propertyId}/review_channels`).doc(channel.id).set({
                lastSyncedAt: FieldValue.serverTimestamp(),
                lastStatus: 'failed',
                lastError: error.message
            }, { merge: true });
            results.push({ source: channel.source, inserted: 0, error: error.message });
        }
    }
    return results;
};

const sendSms = async (to: string, body: string) => {
    const twilio = getTwilio();
    if (!twilio || !TWILIO_FROM) throw new Error('Twilio not configured');
    await twilio.messages.create({ to, from: TWILIO_FROM, body });
};

const sendEmail = async (to: string, subject: string, body: string) => {
    const sg = getSendGrid();
    if (!sg || !SENDGRID_FROM) throw new Error('SendGrid not configured');
    await sg.send({ to, from: SENDGRID_FROM, subject, text: body, html: `<pre>${body}</pre>` });
};

const buildSurveyLink = (propertyId: string, reservationId: string) => {
    const base = process.env.REVIEW_SURVEY_BASE || functions.config().reviews?.survey_base || 'https://survey.hotel-singu.com/review';
    return `${base}?propertyId=${encodeURIComponent(propertyId)}&reservationId=${encodeURIComponent(reservationId)}`;
};

const sendPostStaySurvey = async (propertyId: string, reservation: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>, propertyName: string) => {
    const data = reservation.data() || {};
    if (data.postSurveySent) return;
    const checkout = data.checkOut ? toMillis(data.checkOut) : 0;
    const now = Date.now();
    if (!checkout || (now - checkout) > (72 * 60 * 60 * 1000)) return; // within 72h of checkout

    const guestId = data.guestId || data.guest?.id;
    let guest: any = null;
    if (guestId) {
        const g = await db.collection(`properties/${propertyId}/guests`).doc(guestId).get();
        guest = g.exists ? g.data() : null;
    }
    const email = data.guestEmail || guest?.email;
    const phone = data.guestPhone || guest?.phone;
    if (!email && !phone) return;

    const surveyLink = buildSurveyLink(propertyId, reservation.id);
    const message = `Thank you for staying at ${propertyName}. We’d love your feedback: ${surveyLink}`;

    try {
        if (phone) await sendSms(phone, message);
        else if (email) await sendEmail(email, `${propertyName} • Post-stay survey`, message);

        await reservation.ref.set({
            postSurveySent: true,
            postSurveySentAt: FieldValue.serverTimestamp()
        }, { merge: true });

        await db.collection(`properties/${propertyId}/post_stay_surveys`).add({
            reservationId: reservation.id,
            guestId,
            channel: phone ? 'sms' : 'email',
            message,
            sentAt: FieldValue.serverTimestamp()
        });
    } catch (error: any) {
        functions.logger.error('[Reviews] survey send failed', { propertyId, reservationId: reservation.id, error: error.message });
    }
};

export const ingestReviewWebhook = functions.https.onRequest(async (req, res) => {
    try {
        const propertyId = String(req.query.propertyId || req.body?.propertyId || '').trim();
        if (!propertyId) throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
        const payload = req.body as unknown as Partial<ReviewInput>;
        const reviewPayload: ReviewInput = {
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
        await storeReview(propertyId, {
            ...reviewPayload,
            source: reviewPayload.source || 'ota',
            createdAt: reviewPayload.createdAt || Date.now()
        });
        res.status(200).json({ status: 'ok' });
    } catch (error: any) {
        functions.logger.error('[Reviews] ingest failed', error);
        res.status(400).json({ error: error.message || 'failed' });
    }
});

const callAiDraft = async (prompt: string): Promise<string | null> => {
    const OPENAI_KEY = process.env.OPENAI_API_KEY || functions.config().openai?.key;
    if (!OPENAI_KEY) return null;
    try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
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
        const body: any = await resp.json();
        return body.choices?.[0]?.message?.content?.trim() || null;
    } catch (error: any) {
        functions.logger.error('[Reviews] AI draft exception', error);
        return null;
    }
};

export const draftReviewResponse = functions.https.onCall(async (data) => {
    const { propertyId, reviewId, reviewBody, rating, guestName } = data;
    if (!propertyId || !reviewId || !reviewBody) {
        throw new functions.https.HttpsError('invalid-argument', 'propertyId, reviewId, reviewBody required');
    }
    const prompt = [
        `Write a concise, gracious reply to a hotel review.`,
        `Rating: ${rating ?? 'N/A'}`,
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
        createdAt: FieldValue.serverTimestamp()
    });

    return { draft, sentiment };
});

export const syncReviews = functions.https.onCall(async (data) => {
    const propertyId = String(data.propertyId || '').trim();
    if (!propertyId) throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
    const results = await syncPropertyReviews(propertyId);
    return { results };
});

export const reviewSyncJob = functions.pubsub.schedule('every 6 hours').onRun(async () => {
    const properties = await db.collection('properties').listDocuments();
    for (const prop of properties) {
        await syncPropertyReviews(prop.id);
    }
    return null;
});

export const postStaySurveyJob = functions.pubsub.schedule('every 3 hours').onRun(async () => {
    const properties = await db.collection('properties').listDocuments();
    for (const prop of properties) {
        const propertySnap = await prop.get();
        const propertyName = (propertySnap.data() as any)?.name || 'Our Hotel';
        const reservations = await db.collection(`properties/${prop.id}/reservations`)
            .where('status', '==', 'Checked Out')
            .get();
        for (const res of reservations.docs) {
            await sendPostStaySurvey(prop.id, res, propertyName);
        }
    }
    return null;
});
