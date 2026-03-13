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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeRoomQuality = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const db = admin.firestore();
const storage = admin.storage();
const OPENAI_KEY = process.env.OPENAI_API_KEY || ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || '';
const MODEL = process.env.ROOM_QA_MODEL || 'gpt-4o-mini';
const uploadBase64Image = async (propertyId, roomId, base64Data) => {
    const bucket = storage.bucket();
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const filename = `properties/${propertyId}/room_quality/${roomId}_${Date.now()}.jpg`;
    const file = bucket.file(filename);
    await file.save(buffer, { contentType: 'image/jpeg', resumable: false });
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 24 * 60 * 60 * 1000 });
    return url;
};
const callOpenAiVision = async (imageUrl) => {
    var _a, _b, _c;
    if (!OPENAI_KEY)
        throw new Error('OPENAI_API_KEY not configured');
    const prompt = [
        'You are a hotel housekeeping inspector.',
        'Evaluate the photo against these checks: bed made, pillows arranged, linens smooth, towels folded, toiletries aligned, floor clear, trash removed, minibar stocked, desk clear.',
        'Return JSON with fields: pass (boolean), score (0-100), findings (array of strings), recommendations (array of strings). Keep it concise.',
    ].join(' ');
    const resp = await (0, node_fetch_1.default)('https://api.openai.com/v1/chat/completions', {
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
    const body = await resp.json();
    const raw = (_c = (_b = (_a = body.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
    try {
        return JSON.parse(raw);
    }
    catch (_d) {
        return { pass: false, score: 0, findings: ['Unable to parse vision response'], recommendations: [] };
    }
};
exports.analyzeRoomQuality = functions.https.onCall(async (data) => {
    const { propertyId, roomId, imageUrl, imageBase64 } = data;
    if (!propertyId || !roomId || (!imageUrl && !imageBase64)) {
        throw new functions.https.HttpsError('invalid-argument', 'propertyId, roomId, and image are required');
    }
    let finalUrl = imageUrl;
    if (!finalUrl && imageBase64) {
        finalUrl = await uploadBase64Image(propertyId, roomId, imageBase64);
    }
    const result = await callOpenAiVision(String(finalUrl));
    const payload = Object.assign(Object.assign({ propertyId,
        roomId, imageUrl: finalUrl }, result), { createdAt: admin.firestore.FieldValue.serverTimestamp() });
    const ref = await db.collection(`properties/${propertyId}/room_quality_checks`).add(payload);
    return Object.assign({ id: ref.id }, payload);
});
//# sourceMappingURL=vision.js.map