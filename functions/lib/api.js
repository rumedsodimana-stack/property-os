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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.createApiClient = exports.issueApiToken = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = require("crypto");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const API_SIGNING_KEY = process.env.API_TOKEN_SIGNING_KEY || ((_a = functions.config().api) === null || _a === void 0 ? void 0 : _a.signing_key) || '';
const API_ADMIN_KEY = process.env.API_ADMIN_KEY || ((_b = functions.config().api) === null || _b === void 0 ? void 0 : _b.admin_key) || '';
const signToken = (payload) => {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = (0, crypto_1.createHmac)('sha256', API_SIGNING_KEY).update(body).digest('base64url');
    return `${body}.${sig}`;
};
const verifyToken = (token) => {
    if (!API_SIGNING_KEY)
        throw new Error('API signing key not configured');
    const [body, sig] = token.split('.');
    if (!body || !sig)
        throw new Error('Malformed token');
    const expected = (0, crypto_1.createHmac)('sha256', API_SIGNING_KEY).update(body).digest('base64url');
    if (expected !== sig)
        throw new Error('Invalid signature');
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now())
        throw new Error('Token expired');
    return payload;
};
const hashSecret = (secret) => (0, crypto_1.createHash)('sha256').update(secret).digest('hex');
exports.issueApiToken = functions.https.onCall(async (data) => {
    const { clientId, clientSecret } = data;
    if (!clientId || !clientSecret) {
        throw new functions.https.HttpsError('invalid-argument', 'clientId and clientSecret required');
    }
    const doc = await db.collection('api_clients').doc(clientId).get();
    if (!doc.exists)
        throw new functions.https.HttpsError('not-found', 'Client not found');
    const client = doc.data();
    if (client.secretHash !== hashSecret(clientSecret)) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid credentials');
    }
    const payload = {
        sub: clientId,
        pid: client.propertyId,
        scopes: client.scopes || ['reservations:read', 'rooms:read'],
        exp: Date.now() + 60 * 60 * 1000, // 1h
        jti: (0, crypto_1.randomBytes)(8).toString('hex')
    };
    return { accessToken: signToken(payload), tokenType: 'bearer', expiresIn: 3600 };
});
exports.createApiClient = functions.https.onCall(async (data, context) => {
    const { adminKey, propertyId, scopes = ['reservations:read', 'rooms:read'], name = 'API Client' } = data;
    if (!API_ADMIN_KEY)
        throw new functions.https.HttpsError('failed-precondition', 'API admin key not configured');
    if (adminKey !== API_ADMIN_KEY)
        throw new functions.https.HttpsError('permission-denied', 'Invalid admin key');
    if (!propertyId)
        throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
    const clientId = `api_${(0, crypto_1.randomBytes)(6).toString('hex')}`;
    const secret = (0, crypto_1.randomBytes)(24).toString('hex');
    const secretHash = hashSecret(secret);
    await db.collection('api_clients').doc(clientId).set({
        id: clientId,
        propertyId,
        scopes,
        secretHash,
        name,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { clientId, clientSecret: secret, propertyId, scopes };
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// Auth middleware
app.use((req, res, next) => {
    try {
        const authHeader = req.header('Authorization') || '';
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token)
            throw new Error('Missing bearer token');
        const payload = verifyToken(token);
        req.auth = payload;
        next();
        return;
    }
    catch (error) {
        res.status(401).json({ error: error.message || 'unauthorized' });
        return;
    }
});
app.get('/reservations', async (req, res) => {
    const { pid } = req.auth;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const snap = await db.collection(`properties/${pid}/reservations`).orderBy('checkIn', 'desc').limit(limit).get();
    res.json(snap.docs.map(d => (Object.assign({ id: d.id }, d.data()))));
});
app.get('/rooms', async (req, res) => {
    const { pid } = req.auth;
    const snap = await db.collection(`properties/${pid}/rooms`).limit(200).get();
    res.json(snap.docs.map(d => (Object.assign({ id: d.id }, d.data()))));
});
app.post('/webhooks/events', async (req, res) => {
    const { pid, sub } = req.auth;
    const ref = await db.collection(`properties/${pid}/api_webhooks`).add({
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        clientId: sub,
        payload: req.body
    });
    res.json({ status: 'stored', id: ref.id });
});
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=api.js.map