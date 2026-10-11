# Workflows and State Transitions

## 1. Student request
1. Student signs in.
2. Student opens "Request Gate Pass".
3. Student enters required fields and submits.
4. Server verifies the session, role, field validity, and any confirmed policy constraints.
5. Request is saved as `pending`.
6. Student sees the request reference and current status.

## 2. Staff decision
1. Staff signs in and opens pending requests in their authorized scope.
2. Staff reviews request details.
3. Staff selects Approve or Reject and may enter a note.
4. Server verifies staff role, scope, and that request is still `pending`.
5. Server atomically updates status and decision metadata and writes an audit event.
6. If approved, a short-lived QR pass is issued using a random token whose hash is stored server-side.

## 3. Guard exit verification
1. Guard signs in to the guard view.
2. Guard scans the QR or enters its code manually.
3. Client sends the token to the online verification endpoint.
4. Server checks token hash, expiry, revocation, request approval, and current gate-event state.
5. The UI displays only the information needed for the guard to compare the student with their physical college ID.
6. Guard explicitly confirms the physical ID matches.
7. Guard selects "Record Exit".
8. Server re-checks authorization and state inside an atomic operation; records one exit event and audit entry.
9. UI shows success only after the server confirms the result.

## 4. Return recording
1. Guard locates the active exit through the request/pass workflow.
2. Guard checks the student's college ID according to approved procedure.
3. Guard selects "Record Return".
4. Server verifies the guard role and that an exit exists with no return yet.
5. Server records the return event and audit entry atomically.
6. The request can move to `completed` after the return is recorded.

## 5. Failure cases
- Invalid, expired, revoked, rejected, or already-used pass: do not authorize exit.
- Physical ID mismatch: do not record exit; follow college-approved escalation procedure.
- Network/server unavailable: do not authorize exit in the app; follow a separate officially approved manual emergency procedure, if one exists.
- Double tap/retry: same operation must not create duplicate events.
- Concurrent scans: only one request should win the exit transition.
- Student returns after QR expiry: return operation should be based on the active exit record, not the expired QR token.

## 6. State model
Request status:
`pending → approved → completed`
`pending → rejected`
`pending → cancelled` (if college policy permits)
`approved → expired` (when pass/request validity ends without exit, according to policy)

Gate-event state:
`no exit → exited → returned`

Never allow `no exit → returned`. Do not infer a return merely because the expected return time has passed.
