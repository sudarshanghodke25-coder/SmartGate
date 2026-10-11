# Software Requirements Specification (SRS)

## 1. Purpose
Define the functional and quality requirements for the SmartGate PWA prototype.

## 2. System context
SmartGate includes a browser/PWA client, Supabase authentication, PostgreSQL data protected by RLS, and server-side Edge Functions for sensitive workflows. The browser is not trusted to make authorization decisions.

## 3. Operating environment
- Modern desktop and mobile browsers
- React + TypeScript + Vite frontend
- Supabase Auth/PostgreSQL/RLS/Edge Functions
- Frontend hosting such as Vercel
- Network connection required for pass authorization

## 4. Inputs
- Authentication credentials through the configured auth provider
- Gate-pass request fields
- Staff approval/rejection action
- QR token from the pass
- Guard confirmation of physical college-ID match
- Exit/return action

## 5. Outputs
- Request status and decision note
- QR pass for an approved request
- Guard verification result
- Exit/return event confirmation
- Role-appropriate history and audit records

## 6. Business rules
- Only authorized staff can decide a pending request.
- Only approved, valid, non-revoked passes may proceed to exit verification.
- Physical college ID must be checked by the guard.
- The server determines current state and timestamps.
- Exit and return changes must be atomic and safe against duplicate requests.
- Return is associated with a previously recorded exit and does not depend on the QR still being unexpired.
- When online verification is unavailable, the system must not authorize exit.
- Policy-specific rules such as approval hours, maximum duration, guardian notification, and emergency exceptions must be configured only after college confirmation.

## 7. Data requirements
Core entities: profiles, gate_pass_requests, pass_tokens or token hashes, gate_events, audit_logs, and approved configuration. See `DATABASE_DESIGN.md`.

## 8. External interface requirements
- Auth interface via Supabase Auth
- Database access through authorized client operations and server-side functions
- QR scanning through browser camera where supported, with manual code entry as an accessible fallback
- Do not expose service-role keys or token secrets in frontend code

## 9. Security requirements
- Apply RLS to all tables accessible to clients.
- Deny access by default; grant only required permissions.
- Validate identity, role, ownership, request state, token status, and timestamps server-side.
- Keep secrets in server-side environment variables.
- Log sensitive workflow actions.
- Never treat UI visibility as access control.

## 10. Requirements traceability
Each FR in `PRD.md` should map to a module and test. Track implementation and test status in `IMPLEMENTATION_PLAN.md` and `TEST_PLAN.md`.
