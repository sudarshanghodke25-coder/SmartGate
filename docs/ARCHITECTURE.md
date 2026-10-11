# System Architecture

## 1. Architecture style
A small client-server PWA with a managed backend. Security-sensitive actions are implemented in trusted server-side functions and/or database transactions.

## 2. Logical components
1. **React PWA:** role-aware screens, forms, request status, QR display, guard scanning UI.
2. **Supabase Auth:** sign-in and session management.
3. **PostgreSQL:** authoritative records and state.
4. **RLS policies:** row-level authorization for client database access.
5. **Edge Functions:** sensitive actions such as approve/reject, verify pass, record exit, and record return.
6. **Audit service/table:** append-only records for important actions.
7. **Hosting:** frontend on Vercel or equivalent; backend on Supabase.

## 3. Trust boundaries
- Browser/client is untrusted. A user can alter requests, local state, network calls, or frontend code.
- Authenticated user identity comes from the verified session, not from a user-supplied ID.
- Role and ownership checks must be performed server-side/database-side.
- QR token is a bearer secret until checked; keep it short-lived and random.
- Database constraints/transactions should protect state transitions even if two requests arrive concurrently.

## 4. High-level request flow
Student browser → Auth session → authorized request operation → PostgreSQL.

Staff browser → server-side approval operation → authorization check → atomic status update + audit record → pass issuance.

Guard browser → scan QR → online verification function → token/request/identity/state checks → explicit physical-ID confirmation → exit event transaction.

Return → authorized guard operation → check active exit → atomic return event + audit record.

## 5. Architecture rules
- Do not put Supabase service-role keys in frontend code.
- Do not trust client-provided role, actor ID, status, or timestamp.
- Use database/server time for security-relevant timestamps.
- Use transactions or equivalent atomic operations for state changes.
- Make exit and return endpoints idempotent where practical.
- Avoid broad admin/service privileges for normal client operations.
- Do not use cached PWA content as proof of a valid pass.

## 6. Deployment environments
- Local development
- Preview/test deployment
- Production/demo deployment

Use separate environment variables and backend projects where practical. Never commit secrets.

## 7. Suggested folder structure
```text
smartgate/
  GEMINI.md
  ANTIGRAVITY_GUIDE.md
  docs/
    README.md
    PRD.md
    SRS.md
    ARCHITECTURE.md
    DATABASE_DESIGN.md
    API_CONTRACTS.md
    WORKFLOWS.md
    UI_UX_DESIGN.md
    SECURITY_THREAT_MODEL.md
    TEST_PLAN.md
    IMPLEMENTATION_PLAN.md
    DECISIONS.md
  src/
    app/
    components/
    features/
      auth/
      student/
      staff/
      guard/
      admin/
    lib/
    types/
  supabase/
    migrations/
    functions/
  tests/
```
