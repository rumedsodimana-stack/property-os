<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Hotel Singularity OS

A full-stack hotel property operations system with multi-provider AI integration, real-time dashboards, and modular architecture. Built for boutique hotels through enterprise chains, Singularity OS unifies front desk, housekeeping, F&B, finance, engineering, security, and more into one dark-themed operator interface.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS (utility-first, dark theme) |
| Charts | Recharts |
| Icons | Lucide React |
| Backend / DB | Firebase (Firestore, Auth, Functions) |
| AI Providers | Anthropic Claude, OpenAI, Google Gemini, Ollama (local) |
| Payments | Stripe |
| OCR | Tesseract.js |
| PDF | pdfjs-dist |
| Testing | Playwright |
| Mobile | React Native (guest-app, staff-app) |
| Edge Runtime | Node.js kernel (`edgeNode/kernel.mjs`) |

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd Hotel_Singularity_OS_Source

# Install dependencies
npm install

# (Optional) Install Demo_200Rooms sub-project too
npm run install:all
```

### Environment Setup

```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local and add at minimum one AI provider key:
#   VITE_ANTHROPIC_API_KEY, VITE_OPENAI_API_KEY, or VITE_GEMINI_API_KEY
# For Firebase features, also add VITE_FIREBASE_* variables.
```

### Run Development Server

```bash
# Standard dev server (port 5173)
npm run dev

# Dev server + edge kernel (full stack)
npm run dev:full

# Demo mode (port 3004, seeded data)
npm run dev:demo

# Both main + Demo_200Rooms side by side
npm run dev:both
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run dev:demo` | Start in demo mode on port 3004 |
| `npm run dev:full` | Start dev server + edge kernel concurrently |
| `npm run dev:both` | Run main app (5173) and Demo_200Rooms (5174) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run kernel` | Start the edge node kernel only |
| `npm run test:smoke-modules` | Run Playwright module smoke tests |
| `npm run audit:firestore-rules` | Audit Firestore collection access rules |
| `npm run seed:demo:5star` | Seed a 5-star busy demo property |
| `npm run seed:demo:20room` | Seed a 20-room operational hotel |
| `npm run seed:demo:property2` | Seed a second compact property |
| `npm run install:all` | Install deps for main + Demo_200Rooms |

## Project Structure

```
Hotel_Singularity_OS_Source/
├── components/
│   ├── OpsApp.tsx              # Main operator application shell
│   ├── OperatorLayout.tsx      # Reusable sidebar + topbar + content layout
│   ├── GuestApp.tsx            # Guest-facing web app
│   ├── modules/                # Feature modules (AI, Engineering, Events, etc.)
│   ├── pms/                    # Property Management (Front Desk, Housekeeping)
│   ├── pos/                    # Point of Sale
│   ├── finance/                # Finance dashboard
│   ├── hr/                     # Human Capital / HR
│   ├── procurement/            # Procurement dashboard
│   ├── communication/          # Internal messaging (Connect)
│   ├── configuration/          # System configuration hub
│   ├── terminal/               # Admin terminal
│   ├── shared/                 # Shared UI components & modals
│   └── views/                  # Additional views
├── context/                    # React context providers (Auth, AppEnvironment)
├── services/                   # Business logic, AI adapters, kernel bridge
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript type definitions
├── edgeNode/                   # Edge runtime kernel (Node.js)
├── functions/                  # Firebase Cloud Functions
├── mobile/
│   ├── guest-app/              # React Native guest app
│   └── staff-app/              # React Native staff app
├── Demo_200Rooms/              # Standalone 200-room demo sub-project
├── scripts/                    # Seed scripts and utilities
├── tests/                      # Playwright smoke tests
├── public/                     # Static assets
├── firestore.rules             # Firestore security rules
├── firebase.json               # Firebase project config
├── vite.config.ts              # Vite configuration
└── tsconfig.json               # TypeScript configuration
```

## Demo Mode

Run the app in demo mode to explore all modules with pre-seeded data and without requiring a live Firebase backend:

```bash
npm run dev:demo
```

You can also seed specific demo scenarios into a Firebase project:

```bash
npm run seed:demo:5star      # Luxury 5-star busy hotel
npm run seed:demo:20room     # Compact 20-room operational hotel
npm run seed:demo:property2  # Second property (multi-property testing)
```

Demo login credentials: Employee ID `GM001`, PIN `1234`.

## Mobile Apps

The `mobile/` directory contains two React Native applications:

- **guest-app** -- Guest-facing app for reservations, digital key, and services
- **staff-app** -- Staff-facing app for on-the-go operations

Each has its own `package.json`. Install and run them independently:

```bash
cd mobile/guest-app && npm install && npx expo start
cd mobile/staff-app && npm install && npx expo start
```

## Security Notes

- Firestore rules require authentication; demo access uses anonymous sign-in
- Never commit `.env` or `.env.local` (they are gitignored)
- AI API keys are never persisted to localStorage
- Webhook secrets: use `VITE_WEBHOOK_SECRET_OPS` and `VITE_WEBHOOK_SECRET_CRM`

## License

Proprietary. All rights reserved.
