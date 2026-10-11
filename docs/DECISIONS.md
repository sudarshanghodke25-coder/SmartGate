# Decisions and Open Questions

## Confirmed project decisions
- Project name: SmartGate.
- Product: responsive Progressive Web App.
- Student identity check: guard compares student with the physical college ID.
- Approval: authorized staff approval is required.
- Gate events: record both exit and return.
- Connectivity: online verification required; no offline app authorization.
- Proposed stack: React + TypeScript + Vite + Tailwind; Supabase Auth/PostgreSQL/RLS/Edge Functions; Vercel or equivalent hosting.

## Open policy questions — college must decide
1. Which staff members/departments may approve requests?
2. What exact fields are required (reason, destination, expected return time, class/section)?
3. Can a student cancel a pending request?
4. Can staff revoke an approved pass? Under what conditions?
5. How long is an approved QR pass valid?
6. Are there time-of-day restrictions or maximum durations?
7. What should guard do when physical ID does not match?
8. Is there an approved manual emergency process during network/server outages? The app itself must still fail closed.
9. Which student details may be shown to a guard?
10. Who may view reports and audit records?
11. How long are request and gate-event records retained?
12. Are guardian/parent notifications required or allowed?
13. Does the college permit real student data in the prototype, and what notice/consent is required?

## Technical decisions to document as implementation proceeds
- QR token format and expiry duration
- Atomic transaction strategy for exit/return
- Idempotency key format
- Supabase RLS policies and test approach
- Deployment environments and secret management
- PWA caching rules
- Audit log retention and export permissions

Do not silently convert an open question into a requirement. Update this file when a decision is confirmed.
