# SmartGate Agent Instructions

You are working on SmartGate, a final-year diploma project: a secure college gate-pass and exit/return management PWA.

## Source of truth
Read the relevant files in `docs/` before coding. Key documents:
- `docs/PRD.md`
- `docs/SRS.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE_DESIGN.md`
- `docs/WORKFLOWS.md`
- `docs/API_CONTRACTS.md`
- `docs/SECURITY_THREAT_MODEL.md`
- `docs/TEST_PLAN.md`
- `docs/DECISIONS.md`

## Stack
React + TypeScript + Vite + Tailwind CSS; Supabase Auth/PostgreSQL/RLS/Edge Functions; PWA; frontend hosting such as Vercel.

## Non-negotiable invariants
- Server/database is the source of truth.
- Never trust client-supplied role, actor ID, approval status, or security timestamp.
- Enforce authorization on server/database, not just in UI.
- Never expose Supabase service-role keys or other secrets in frontend code.
- Online verification unavailable means the app does not authorize exit.
- Guard must check the physical college ID and explicitly confirm the match.
- A pass can create at most one successful exit per cycle.
- Return requires an existing exit and must be safe against duplicate requests.
- Return should remain recordable after QR expiry if the exit is still active.
- Audit history cannot be edited/deleted by ordinary users.
- Do not use cached PWA data to authorize exit.
- Do not add facial recognition, GPS tracking, or AI risk scoring to MVP without explicit approval.

## Engineering workflow
Inspect before editing. Make small changes. Use migrations for schema changes. Add tests for sensitive workflows and authorization. Run checks and state exactly what passed or failed. Update docs when implementation changes decisions or contracts.

## Do not assume
Do not invent college policy, staff approval scope, emergency exceptions, retention periods, or deployment configuration. Record unresolved items in `docs/DECISIONS.md`.
