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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioWebhook = exports.sendGuestMessage = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const index_1 = require("./index"); // circular risk: we will export db from index
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || ((_a = functions.config().twilio) === null || _a === void 0 ? void 0 : _a.sid) || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || ((_b = functions.config().twilio) === null || _b === void 0 ? void 0 : _b.token) || '';
const TWILIO_FROM = process.env.TWILIO_FROM || ((_c = functions.config().twilio) === null || _c === void 0 ? void 0 : _c.from) || '';
const WHATSAPP_FROM = process.env.WHATSAPP_FROM || ((_d = functions.config().whatsapp) === null || _d === void 0 ? void 0 : _d.from) || '';
const SENDGRID_KEY = process.env.SENDGRID_KEY || ((_e = functions.config().sendgrid) === null || _e === void 0 ? void 0 : _e.key) || '';
const SENDGRID_FROM = process.env.SENDGRID_FROM || ((_f = functions.config().sendgrid) === null || _f === void 0 ? void 0 : _f.from) || '';
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
const sendSms = async (to, body) => {
    const twilio = getTwilio();
    if (!twilio || !TWILIO_FROM)
        throw new Error('Twilio not configured');
    await twilio.messages.create({ to, from: TWILIO_FROM, body });
};
const sendWhatsapp = async (to, body) => {
    const twilio = getTwilio();
    if (!twilio || !WHATSAPP_FROM)
        throw new Error('WhatsApp not configured');
    await twilio.messages.create({ to: `whatsapp:${to}`, from: `whatsapp:${WHATSAPP_FROM}`, body });
};
const sendEmail = async (to, subject, body) => {
    const sg = getSendGrid();
    if (!sg || !SENDGRID_FROM)
        throw new Error('SendGrid not configured');
    await sg.send({ to, from: SENDGRID_FROM, subject, text: body, html: `<pre>${body}</pre>` });
};
exports.sendGuestMessage = functions.https.onCall(async (data) => {
    const { propertyId, to, channel, template, context: ctx = {} } = data;
    if (!propertyId || !to || !channel || !template) {
        throw new functions.https.HttpsError('invalid-argument', 'propertyId, to, channel, template required');
    }
    const body = String(template.body || template)
        .replace(/\{\{guestName\}\}/g, ctx.guestName || 'Guest')
        .replace(/\{\{propertyName\}\}/g, ctx.propertyName || 'Hotel')
        .replace(/\{\{checkIn\}\}/g, ctx.checkIn || '')
        .replace(/\{\{room\}\}/g, ctx.room || '');
    try {
        if (channel === 'sms')
            await sendSms(to, body);
        else if (channel === 'whatsapp')
            await sendWhatsapp(to, body);
        else if (channel === 'email')
            await sendEmail(to, template.subject || 'Hotel Singularity', body);
        else
            throw new Error('Unsupported channel');
        await index_1.db.collection(`properties/${propertyId}/guest_messages`).add({
            to, channel, body, template,
            context: ctx,
            sentAt: firestore_1.FieldValue.serverTimestamp(),
            status: 'sent'
        });
        return { status: 'sent' };
    }
    catch (error) {
        await index_1.db.collection(`properties/${propertyId}/guest_messages`).add({
            to, channel, body, template,
            context: ctx,
            sentAt: firestore_1.FieldValue.serverTimestamp(),
            status: 'failed',
            error: error.message
        });
        throw new functions.https.HttpsError('internal', error.message || 'Send failed');
    }
});
exports.twilioWebhook = functions.https.onRequest(async (req, res) => {
    // Accept inbound SMS/WhatsApp from Twilio and store in Firestore
    const from = req.body.From || '';
    const body = req.body.Body || '';
    const propertyId = String(req.query.propertyId || req.body.propertyId || '').trim() || 'unknown';
    const channel = String(req.body.Channel || (from.startsWith('whatsapp:') ? 'whatsapp' : 'sms'));
    try {
        const ref = await index_1.db.collection(`properties/${propertyId}/guest_messages`).add({
            from,
            body,
            channel,
            direction: 'inbound',
            receivedAt: firestore_1.FieldValue.serverTimestamp()
        });
        res.status(200).json({ status: 'ok', id: ref.id });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'failed' });
    }
});
//# sourceMappingURL=messaging.js.map