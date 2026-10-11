# Security Threat Model

## Assets
- Student identity/profile information
- Gate-pass requests and approval decisions
- QR bearer tokens
- Exit and return event records
- Staff/admin privileges
- Audit history and configuration

## Threats and controls
### Forged approval
**Threat:** user changes frontend state or submits `status=approved`.  
**Control:** approval fields are written only through trusted server-side logic; database permissions/RLS block direct mutation.

### Role escalation
**Threat:** student edits their profile role to staff/guard/admin.  
**Control:** no self-service role updates; trusted admin workflow; server checks role for every sensitive operation.

### QR replay or screenshot reuse
**Threat:** someone reuses a copied QR.  
**Control:** random, short-lived token; online state validation; atomic one-exit transition; revocation support.

### Token leakage
**Threat:** token appears in logs, URLs, analytics, or screenshots.  
**Control:** avoid URL query strings where possible, do not log raw tokens, use secure transport, store only token hashes.

### Race condition
**Threat:** two guards/devices record exit concurrently.  
**Control:** database transaction, conditional state update, uniqueness/locking constraints, concurrency tests.

### Unauthorized data access
**Threat:** student reads another student's request; guard browses full student table.  
**Control:** RLS, minimal guard response, least privilege, negative authorization tests.

### False return record
**Threat:** return is recorded without a corresponding exit.  
**Control:** server-side state check and atomic transition.

### Network outage
**Threat:** client uses cached or stale pass information.  
**Control:** fail closed for authorization; no offline pass approval. Any manual emergency process must be separately approved by the college.

### Audit tampering
**Threat:** ordinary user edits or deletes logs.  
**Control:** append-only write path for trusted operations; client cannot update/delete audit rows.

## Security invariants
1. The server is the source of truth for role, status, validity, and timestamps.
2. No online validation means no app authorization.
3. Physical college ID must be checked by the guard.
4. One approved pass cannot create multiple successful exits in the same cycle.
5. Return requires a prior exit.
6. Return must not be blocked only because the QR expired after exit.
7. Ordinary users cannot alter audit history.
8. No secret keys in frontend or Git.
9. PWA cache is never proof of authorization.

## Privacy
Collect the minimum information needed. Define data retention, access, incident handling, and student notice with the college before real deployment. Use synthetic test records during development.
