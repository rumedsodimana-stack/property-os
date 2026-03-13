import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

const db = admin.firestore();
const storage = admin.storage();

const OPENAI_KEY = process.env.OPENAI_API_KEY || functions.config().openai?.key || '';
const MODEL = process.env.ROOM_QA_MODEL || 'gpt-4o-mini';

type AnalyzePayload = {
    propertyId: string;
    roomId: string;
    imageUrl?: string;
    imageBase64?: string;
};

const uploadBase64Image = async (propertyId: string, roomId: string, base64Data: string): Promise<string> => {
    const bucket = storage.bucket();
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const filename = `properties/${propertyId}/room_quality/${roomId}_${Date.now()}.jpg`;
    const file = bucket.file(filename);
    await file.save(buffer, { contentType: 'image/jpeg', resumable: false });
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 24 * 60 * 60 * 1000 });
    return url;
};

const callOpenAiVision = async (imageUrl: string) => {
    if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not configured');
    const prompt = [
        'You are a hotel housekeeping inspector.',
        'Evaluate the photo against these checks: bed made, pillows arranged, linens smooth, towels folded, toiletries aligned, floor clear, trash removed, minibar stocked, desk clear.',
        'Return JSON with fields: pass (boolean), score (0-100), findings (array of strings), recommendations (array of strings). Keep it concise.',
    ].join(' ');

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: [{ type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } }] }
            ],
            max_tokens: 400,
            temperature: 0.2
        })
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`OpenAI vision failed: ${resp.status} ${text}`);
    }
    const body = await resp.json() as any;
    const raw = body.choices?.[0]?.message?.content;
    try {
        return JSON.parse(raw);
    } catch {
        return { pass: false, score: 0, findings: ['Unable to parse vision response'], recommendations: [] };
    }
};

export const analyzeRoomQuality = functions.https.onCall(async (data) => {
    const { propertyId, roomId, imageUrl, imageBase64 } = data as AnalyzePayload;
    if (!propertyId || !roomId || (!imageUrl && !imageBase64)) {
        throw new functions.https.HttpsError('invalid-argument', 'propertyId, roomId, and image are required');
    }

    let finalUrl = imageUrl;
    if (!finalUrl && imageBase64) {
        finalUrl = await uploadBase64Image(propertyId, roomId, imageBase64);
    }

    const result = await callOpenAiVision(String(finalUrl));
    const payload = {
        propertyId,
        roomId,
        imageUrl: finalUrl,
        ...result,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const ref = await db.collection(`properties/${propertyId}/room_quality_checks`).add(payload);
    return { id: ref.id, ...payload };
});
