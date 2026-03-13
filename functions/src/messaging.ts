import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./index"; // circular risk: we will export db from index
import { Request, Response } from "express";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || functions.config().twilio?.sid || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || functions.config().twilio?.token || '';
const TWILIO_FROM = process.env.TWILIO_FROM || functions.config().twilio?.from || '';
const WHATSAPP_FROM = process.env.WHATSAPP_FROM || functions.config().whatsapp?.from || '';
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

const sendSms = async (to: string, body: string) => {
    const twilio = getTwilio();
    if (!twilio || !TWILIO_FROM) throw new Error('Twilio not configured');
    await twilio.messages.create({ to, from: TWILIO_FROM, body });
};

const sendWhatsapp = async (to: string, body: string) => {
    const twilio = getTwilio();
    if (!twilio || !WHATSAPP_FROM) throw new Error('WhatsApp not configured');
    await twilio.messages.create({ to: `whatsapp:${to}`, from: `whatsapp:${WHATSAPP_FROM}`, body });
};

const sendEmail = async (to: string, subject: string, body: string) => {
    const sg = getSendGrid();
    if (!sg || !SENDGRID_FROM) throw new Error('SendGrid not configured');
    await sg.send({ to, from: SENDGRID_FROM, subject, text: body, html: `<pre>${body}</pre>` });
};

export const sendGuestMessage = functions.https.onCall(async (data) => {
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
        if (channel === 'sms') await sendSms(to, body);
        else if (channel === 'whatsapp') await sendWhatsapp(to, body);
        else if (channel === 'email') await sendEmail(to, template.subject || 'Hotel Singularity', body);
        else throw new Error('Unsupported channel');

        await db.collection(`properties/${propertyId}/guest_messages`).add({
            to, channel, body, template,
            context: ctx,
            sentAt: FieldValue.serverTimestamp(),
            status: 'sent'
        });
        return { status: 'sent' };
    } catch (error: any) {
        await db.collection(`properties/${propertyId}/guest_messages`).add({
            to, channel, body, template,
            context: ctx,
            sentAt: FieldValue.serverTimestamp(),
            status: 'failed',
            error: error.message
        });
        throw new functions.https.HttpsError('internal', error.message || 'Send failed');
    }
});

export const twilioWebhook = functions.https.onRequest(async (req: Request, res: Response) => {
    // Accept inbound SMS/WhatsApp from Twilio and store in Firestore
    const from = req.body.From || '';
    const body = req.body.Body || '';
    const propertyId = String(req.query.propertyId || req.body.propertyId || '').trim() || 'unknown';
    const channel = String(req.body.Channel || (from.startsWith('whatsapp:') ? 'whatsapp' : 'sms'));
    try {
        const ref = await db.collection(`properties/${propertyId}/guest_messages`).add({
            from,
            body,
            channel,
            direction: 'inbound',
            receivedAt: FieldValue.serverTimestamp()
        });
        res.status(200).json({ status: 'ok', id: ref.id });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'failed' });
    }
});
