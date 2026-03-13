# Property Onboarding Engine Guide

## Purpose
The Property Onboarding Engine is the controlled setup flow for rooms, categories, traits, and deployment metadata.
It is designed for production-safe onboarding with draft persistence, readiness scoring, and audited deployment output.

## Where to Open
1. Open `Configuration`.
2. Select `Room Configuration`.

## What Is New (High-End Mode)
1. Preset blueprints for rapid setup:
   - Boutique 48
   - Business 128
   - Resort 220
   - Extended Stay 96
2. Import/Export JSON blueprint support.
3. Deployment profile metadata:
   - Property Segment
   - Opening Mode
   - Go-Live Date
   - Operational Notes
4. Readiness score and checklist (critical + advisory checks).
5. Safer deploy flow with explicit error reporting and local draft continuity.

## Standard Workflow
1. Choose a preset or start manually.
2. Step 1: Define room categories.
3. Step 2: Define trait modifiers.
4. Step 3: Create floor blocks and room inventory.
5. Review readiness score.
6. Step 4: Deploy property.

## Data Written on Deploy
Deploy writes to these targets:
1. `rooms`
2. `roomCategories`
3. `systemConfig/roomOnboarding`

`systemConfig/roomOnboarding` includes:
1. Deployment timestamp
2. Totals (rooms/floors)
3. Categories and attributes
4. Metadata profile
5. Readiness score and checklist snapshot

## Import/Export Format
The engine accepts either:
1. Full payload:
```json
{
  "version": 2,
  "exportedAt": "2026-02-26T12:00:00.000Z",
  "data": {
    "categories": [],
    "attributes": [],
    "floors": [],
    "rooms": []
  },
  "metadata": {
    "propertySegment": "Business Hotel",
    "openingMode": "soft_launch",
    "goLiveDate": "2026-03-15",
    "notes": "Cutover wave 1",
    "source": "import"
  }
}
```
2. Legacy data-only payload (arrays only). The engine auto-normalizes it.

## Readiness Checks
Critical checks (must pass):
1. Categories defined
2. Traits defined
3. Floors created
4. Rooms generated
5. No duplicate room numbers

Advisory checks:
1. Floor-to-category mapping integrity
2. Category utilization coverage
3. Go-live date format

## Permission Troubleshooting
If deploy fails with `Missing or insufficient permissions`:
1. Confirm logged-in role has write access for `rooms`, `roomCategories`, and `systemConfig` in Firestore rules.
2. Ensure latest rules are deployed:
   - `firebase deploy --only firestore:rules`
3. Confirm session is a valid Firebase-authenticated operator session.

## Rollback / Recovery
1. Use `Export Blueprint` before major changes.
2. If a deploy fails, fix issue and redeploy; local draft remains available.
3. Use `Reset Draft` only when intentionally starting over.
