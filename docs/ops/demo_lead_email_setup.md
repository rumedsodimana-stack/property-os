# Demo Lead Email Notifications Setup

This project now includes a Cloud Function trigger:
- `notifyOnDemoInquiry` (fires on `demo_inquiries/{id}` create)

It sends an email notification with:
- Full Name
- Email
- Contact Number
- Business Name
- Request timestamp/source

## 1. Upgrade Firebase project to Blaze
Cloud Functions deployment currently requires Blaze for this project:
- https://console.firebase.google.com/project/singularity-property-os/usage/details

## 2. Set SMTP + notification config
Run from project root:

```bash
npx firebase functions:config:set \
  smtp.host="smtp.yourprovider.com" \
  smtp.port="587" \
  smtp.user="smtp-user" \
  smtp.pass="smtp-password" \
  notifications.demo_leads_to="your-inbox@yourdomain.com" \
  notifications.demo_leads_from="Hotel Singularity OS <no-reply@yourdomain.com>"
```

Notes:
- Port `465` will use secure SMTP automatically.
- For Gmail, use an App Password (not your normal account password).

## 3. Deploy function

```bash
npx firebase deploy --only functions --project singularity-property-os
```

## 4. Verify
1. Open website contact form.
2. Submit a test lead.
3. Check Firestore `demo_inquiries` document fields:
   - `notificationStatus`
   - `notificationSentAt` (if success)
   - `notificationError` (if failed)
