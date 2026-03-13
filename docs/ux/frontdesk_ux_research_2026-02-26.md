# Front Desk UX Deep Research and Upgrade Plan

Date: 2026-02-26  
Scope: Front Desk operator workflow (arrivals, departures, room assignment, reservation lookup, queue handling)

## Goal

Design a smoother, faster front desk experience under high-traffic shift conditions:

1. Reduce clicks and context switching.
2. Surface the highest-risk tasks early (unassigned arrivals, balance due departures, OOO/OOS blockers).
3. Improve search and navigation speed.
4. Keep flows resilient during peak load.

## External Benchmark Signals

### 1) Oracle OPERA Cloud (enterprise front desk patterns)

Observed patterns from OPERA documentation:

1. Mass check-in and auto-assign + check-in workflows from Arrivals/Room Assignment.
2. Batch room assignment with criteria and fallback/override flows.
3. Failure-first status review for batch operations and retry capability.
4. Advance check-in flows and explicit prerequisites/guardrails (payment, room status, assignment).

Why this matters:
These patterns reduce queue time and prevent manual bottlenecks during peak arrival windows.

### 2) Cloudbeds (operationally guided digital check-in)

Observed patterns from Cloudbeds docs:

1. Configurable digital check-in step flows.
2. Pre-check-in data collection (guest details, documents, notes, payment).
3. Arrival/departure retrieval via explicit filters and API-first integration guidance.

Why this matters:
Pre-arrival data quality lowers front desk friction and shortens desk-side interaction time.

### 3) Mews + Stayntouch (speed + self-service + staff mobility)

Observed patterns from product pages/docs:

1. Self-service check-in/out with guest autonomy and queue reduction.
2. Front desk teams spend more time on exceptions/hospitality, less on repetitive admin.
3. Upsell-ready arrival moments and mobile-first operational flexibility.

Why this matters:
Modern desk UX must optimize both transaction speed and service quality for exceptions.

## Current Front Desk Audit (Your Module)

Audited file:
`components/pms/FrontDesk.tsx`

Key findings before this update:

1. Several views existed but were not reachable from the visible sub-nav (Guests, Reports, Blocks, Floorplan).
2. Search suggestion state existed but was not rendered; users had no guided jump list.
3. No explicit shift-priority queue UI (unassigned arrivals, balances due, maintenance blockers).
4. No keyboard-first navigation to switch workflows quickly.
5. Save errors were set in state but not surfaced clearly to operators.

## What We Implemented (This Pass)

1. Full sub-navigation access for all major Front Desk views:
   - Monitor, Floorplan, Timeline, Arrivals, Departures, Reservations, Guests, Blocks, Reports, Oracle
2. Search UX upgrade:
   - Visible suggestion dropdown
   - Keyboard navigation (`ArrowUp/ArrowDown/Enter/Escape`)
   - `Ctrl/Cmd+K` quick focus
   - Clear-search action
3. Shift Queue strip added:
   - Arrivals today + unassigned count
   - Departures today + balances due count
   - VIP arrival count
   - Rooms out-of-order count
   - Each card links directly to the relevant workflow
4. Error visibility:
   - Inline dismissible error banner for reservation/assignment save failures
5. Keyboard workflow routing:
   - Single-key view switching when not typing (`G/F/T/A/D/R/U/B/P/O`)
6. Sync state hint:
   - Lightweight “Syncing” indicator during PMS load/sync.

## Next Front Desk UX Waves (Recommended)

1. Batch Operations:
   - Add mass actions in Arrivals/Departures (mass check-in/out with per-row validation report).
2. Exception Queue:
   - Add dedicated “Needs Attention” queue (payment invalid, no room assigned, profile incomplete).
3. One-Click Desk Completion:
   - Combined “Assign + Check-In” from arrival card where policy allows.
4. Predictive Load Support:
   - Pre-sort arrivals by ETA, VIP tier, room readiness confidence.
5. Shift Handover:
   - Add end-of-shift unresolved queue export and acknowledgements.

## Sources

1. Oracle OPERA Cloud – Batch Room Assignment:  
   https://docs.oracle.com/en/industries/hospitality/opera-cloud/26.1/ocsuh/t_front_desk_batch_room_assignment.htm
2. Oracle OPERA Cloud – Mass Check In:  
   https://docs.oracle.com/en/industries/hospitality/opera-cloud/25.3/ocsuh/t_checking_in_multiple_reservations_mass_check_in.htm
3. Oracle OPERA Cloud – Mass Check In overview:  
   https://docs.oracle.com/en/industries/hospitality/opera-cloud/21.5/ocsuh/c_mass_check_in_checking_in_multiple_reservations.htm
4. Cloudbeds Guest Portal – Digital check-in setup:  
   https://myfrontdesk.cloudbeds.com/hc/en-us/articles/22338438819099-Guest-Portal-Set-up-Digital-Check-in-for-guests
5. Cloudbeds Developer Docs – Check-in integration workflow:  
   https://developers.cloudbeds.com/docs/check-in-upsell-upgrade
6. Mews – Hotel self check-in software:  
   https://www.mews.com/en/products/guest-self-check-in
7. Mews – Kiosk check-in tour:  
   https://www.mews.com/en/product-tours/kiosk-check-in
8. Stayntouch – Front Desk product page:  
   https://www.stayntouch.com/front-desk/

