<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Hotel Singularity OS

Property operations system with AI integration (React 19 + Vite 6 + Firebase).

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Copy [.env.template](.env.template) to `.env.local` and set:
   - `VITE_FIREBASE_*` or `VITE_GEMINI_API_KEY` (or other AI provider keys)
3. Run: `npm run dev`

## Seed Scripts

For `Demo_200Rooms/scripts/seedBoutiqueDemo5Star.mjs`:
- Set `FIREBASE_API_KEY` or `VITE_FIREBASE_API_KEY` in `.env` or `.env.local`
- Run from project root (or Demo_200Rooms) after `npm install`

## Security Notes

- Firestore rules require authentication; demo access is limited to anonymous sign-in
- Never commit `.env` or `.env.demo` (they are gitignored)
- Webhook secrets: use `VITE_WEBHOOK_SECRET_OPS` and `VITE_WEBHOOK_SECRET_CRM`
- AI API keys are never persisted to localStorage
