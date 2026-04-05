# Bounty Candidate Shortlist

Date: 2026-03-31

## Current Cal.com Open Bounties Reviewed

### Issue 13532

- Title: `allow emails and invite people to a team event-type directly from "assignment" if not in team yet`
- Bounty: `$20`
- Why it is attractive:
  - Lowest complexity from the current list
  - Touches an isolated assignment flow in the event-type UI
- What likely needs to change:
  - `apps/web/modules/event-types/components/AddMembersWithSwitch.tsx`
  - `packages/features/eventtypes/components/CheckedTeamSelect.tsx`
  - A server-side invite or membership-creation flow for entered emails
- Risk:
  - Not just UI. It likely needs backend invite logic, validation, and tests.

### Issue 18987

- Title: `add the same "booking questions" to routing forms`
- Bounty: `$50`
- Why it is attractive:
  - Better payout than the `$20` issue
  - Routing-form code is fairly well isolated
- What likely needs to change:
  - `apps/web/components/apps/routing-forms/*`
  - `apps/web/modules/form-builder/*`
  - Shared booking-question or field-builder components
- Risk:
  - Broader UI reuse task with higher regression surface than the `$20` issue.

### Issue 16378

- Title: `Take into account guest's availability when rescheduling`
- Bounty: `$200`
- Why it is attractive:
  - Highest payout
- Risk:
  - More complex product logic, more comments, already assigned, and likely larger testing surface.

## Best First Pick

- Start with `Issue 13532` if the goal is fastest path to a submitted bounty PR.
- Keep `Issue 18987` as the second option if the assignment flow turns out to require too much hidden backend work.
