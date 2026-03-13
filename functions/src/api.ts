import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createHmac, randomBytes, createHash } from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const API_SIGNING_KEY = process.env.API_TOKEN_SIGNING_KEY || functions.config().api?.signing_key || '';
const API_ADMIN_KEY = process.env.API_ADMIN_KEY || functions.config().api?.admin_key || '';

type TokenPayload = {
  sub: string;
  pid: string;
  scopes: string[];
  exp: number;
  jti: string;
};

const signToken = (payload: TokenPayload): string => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', API_SIGNING_KEY).update(body).digest('base64url');
  return `${body}.${sig}`;
};

const verifyToken = (token: string): TokenPayload => {
  if (!API_SIGNING_KEY) throw new Error('API signing key not configured');
  const [body, sig] = token.split('.');
  if (!body || !sig) throw new Error('Malformed token');
  const expected = createHmac('sha256', API_SIGNING_KEY).update(body).digest('base64url');
  if (expected !== sig) throw new Error('Invalid signature');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload;
  if (payload.exp < Date.now()) throw new Error('Token expired');
  return payload;
};

const hashSecret = (secret: string) => createHash('sha256').update(secret).digest('hex');

export const issueApiToken = functions.https.onCall(async (data) => {
  const { clientId, clientSecret } = data;
  if (!clientId || !clientSecret) {
    throw new functions.https.HttpsError('invalid-argument', 'clientId and clientSecret required');
  }
  const doc = await db.collection('api_clients').doc(clientId).get();
  if (!doc.exists) throw new functions.https.HttpsError('not-found', 'Client not found');
  const client = doc.data() as any;
  if (client.secretHash !== hashSecret(clientSecret)) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid credentials');
  }
  const payload: TokenPayload = {
    sub: clientId,
    pid: client.propertyId,
    scopes: client.scopes || ['reservations:read', 'rooms:read'],
    exp: Date.now() + 60 * 60 * 1000, // 1h
    jti: randomBytes(8).toString('hex')
  };
  return { accessToken: signToken(payload), tokenType: 'bearer', expiresIn: 3600 };
});

export const createApiClient = functions.https.onCall(async (data, context) => {
  const { adminKey, propertyId, scopes = ['reservations:read', 'rooms:read'], name = 'API Client' } = data;
  if (!API_ADMIN_KEY) throw new functions.https.HttpsError('failed-precondition', 'API admin key not configured');
  if (adminKey !== API_ADMIN_KEY) throw new functions.https.HttpsError('permission-denied', 'Invalid admin key');
  if (!propertyId) throw new functions.https.HttpsError('invalid-argument', 'propertyId required');

  const clientId = `api_${randomBytes(6).toString('hex')}`;
  const secret = randomBytes(24).toString('hex');
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

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Auth middleware
app.use((req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) throw new Error('Missing bearer token');
    const payload = verifyToken(token);
    (req as any).auth = payload;
    next();
    return;
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'unauthorized' });
    return;
  }
});

app.get('/reservations', async (req: Request, res: Response) => {
  const { pid } = (req as any).auth as TokenPayload;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const snap = await db.collection(`properties/${pid}/reservations`).orderBy('checkIn', 'desc').limit(limit).get();
  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});

app.get('/rooms', async (req: Request, res: Response) => {
  const { pid } = (req as any).auth as TokenPayload;
  const snap = await db.collection(`properties/${pid}/rooms`).limit(200).get();
  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});

app.post('/webhooks/events', async (req: Request, res: Response) => {
  const { pid, sub } = (req as any).auth as TokenPayload;
  const ref = await db.collection(`properties/${pid}/api_webhooks`).add({
    receivedAt: admin.firestore.FieldValue.serverTimestamp(),
    clientId: sub,
    payload: req.body
  });
  res.json({ status: 'stored', id: ref.id });
});

export const api = functions.https.onRequest(app);
