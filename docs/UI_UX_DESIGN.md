# UI/UX Design Specification

## 1. Design principles
- Mobile-first and easy to use at the gate.
- Clear, plain English with optional Marathi labels if the college requests them.
- Make current state unmistakable: Pending, Approved, Rejected, Expired, Exited, Returned.
- Use confirmation steps for sensitive actions.
- Do not communicate authorization using color alone.
- Provide keyboard-accessible controls and readable contrast.

## 2. Shared layout
- Header with SmartGate brand and signed-in user's role.
- Main navigation filtered by role, with backend authorization still enforced.
- Status messages and loading/error states.
- Sign-out control.

## 3. Student screens
1. Sign in
2. Student dashboard: create request, recent requests, current status
3. New request form: reason and only the additional fields approved by college policy
4. Request details: status, decision note, pass QR when approved, expected return information
5. History

## 4. Staff screens
1. Staff dashboard with pending count
2. Pending request list with filters
3. Request detail with approve/reject actions
4. Decision confirmation and optional note
5. Recent decisions

## 5. Guard screens
1. Guard sign in
2. Scan pass / enter code
3. Verification result with minimal identity details
4. Required physical college-ID confirmation checkbox or explicit confirmation action
5. Record Exit / Record Return
6. Clear success/error state and recent gate events

The guard interface should use large controls, high contrast, and minimal typing. Never show "Approved" as "safe to exit" until online validation succeeds and physical ID confirmation is completed.

## 6. Admin screens
1. User/role administration, restricted to approved administrators
2. Searchable request and gate-event records
3. Audit history
4. Configuration view for only those policies approved by the college

## 7. Design states to implement
Loading, empty, success, validation error, network unavailable, unauthorized, expired pass, revoked pass, duplicate event, identity mismatch, server error.

## 8. Suggested component structure
- `AppShell`
- `RoleGuard` (navigation convenience only, not security)
- `StatusBadge`
- `RequestForm`
- `RequestCard`
- `DecisionPanel`
- `QrPassCard`
- `PassScanner`
- `IdentityCheck`
- `GateActionPanel`
- `AuditEventList`
