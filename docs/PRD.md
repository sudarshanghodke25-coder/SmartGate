# Product Requirements Document (PRD)

## 1. Product summary
SmartGate is a responsive PWA for managing college gate-pass requests and recording student exit/return events. It supplements the college's existing permission policy; it does not decide policy itself.

## 2. Users and roles
### Student
Can view their own profile and submit/view their own requests. Cannot approve requests or mark gate events.

### Approving Staff
Can review requests assigned to them or within their authorized scope, approve/reject with a recorded decision, and view relevant request history.

### Security Guard
Can scan or enter a pass code, see only the information needed for gate verification, confirm the physical college ID matches the record, and record exit/return events.

### Administrator
Can manage user roles and approved configuration, view audit records, and support account/profile maintenance. Administrative actions must be restricted and logged.

## 3. User stories
- As a student, I want to request permission to leave campus and provide a reason and expected return time.
- As a student, I want to see whether my request is pending, approved, rejected, cancelled, or expired.
- As staff, I want to review request details and approve or reject with an optional note.
- As a guard, I want to verify a QR pass online and confirm the student's physical college ID before allowing exit.
- As a guard, I want to record the student's exit and later return.
- As an administrator, I want to inspect a traceable history of decisions and gate events.
- As the project team, we need to test that users cannot perform actions outside their role.

## 4. Functional requirements
**FR-01 Authentication:** users must sign in before using role-protected features.

**FR-02 Role enforcement:** role permissions must be enforced on the server/database, not only by hiding frontend controls.

**FR-03 Student request:** a student can submit a request with required fields defined by college policy, such as reason and expected return time.

**FR-04 Staff decision:** only authorized staff can approve or reject a pending request. The system records who decided, when, and any note.

**FR-05 Pass issuance:** an approved request can receive a cryptographically unpredictable, time-limited QR token. The raw token must not be stored as a reusable database value.

**FR-06 Online validation:** guard verification must call trusted server-side logic. If verification cannot reach the server, the system must not authorize exit.

**FR-07 Identity check:** the guard must compare the displayed identity/reference with the student's physical college ID and explicitly confirm the check.

**FR-08 Exit event:** the system must allow at most one successful exit for the active pass/exit cycle.

**FR-09 Return event:** return can be recorded only after a valid exit event. Return recording must remain possible after the QR pass's expiry, provided the exit is active and the user is authorized.

**FR-10 Audit history:** important actions must be recorded with actor, action, timestamp, and relevant record identifiers.

**FR-11 Student history:** students can see their own request and gate-event history, subject to approved privacy rules.

**FR-12 Administrative review:** authorized administrators can review relevant requests and audit events.

**FR-13 PWA behavior:** the app should be responsive and installable on supported browsers. Cached pages must never be treated as authorization.

**FR-14 Error handling:** show clear messages for expired, rejected, already-used, revoked, invalid, and unverifiable passes without exposing secrets.

## 5. Non-functional requirements
- Security: server-side authorization, RLS, input validation, short-lived tokens, least privilege.
- Reliability: atomic exit/return state changes; idempotent handling of repeated submissions.
- Usability: clear status labels, accessible forms, mobile-first guard screen.
- Performance: common screens should feel responsive on typical college Wi-Fi/mobile data.
- Privacy: collect only data required for the approved workflow.
- Maintainability: TypeScript, documented modules, migrations, linting, tests.
- Auditability: actions should be traceable without allowing ordinary users to edit historical audit events.

## 6. MVP acceptance criteria
- A student cannot approve their own request.
- A student cannot view another student's private request.
- A guard cannot approve requests.
- A pass cannot be used for two successful exits.
- A return cannot be recorded before exit.
- Repeated exit/return requests do not create duplicate events.
- Expired/revoked/invalid pass cannot authorize exit.
- An online verification failure results in no authorization.
- The physical-ID confirmation is required before the exit action.
- Key actions create audit events.
- Core workflows pass automated tests.

## 7. Product constraints
Do not add facial recognition, GPS tracking, AI risk scoring, or offline authorization to the MVP without explicit college approval and a documented privacy/security review.
