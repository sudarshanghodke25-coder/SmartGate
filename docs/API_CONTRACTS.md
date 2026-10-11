# API Contracts (Logical)

Use Supabase Edge Functions or equivalent trusted server-side endpoints for sensitive transitions. Names below are suggestions; document final names in code.

## 1. `submit-request`
**Caller:** authenticated student  
**Input:** reason, optional policy-approved fields such as destination and expected return time  
**Server checks:** session, active student profile, allowed field lengths, policy rules  
**Result:** request ID, status, created timestamp  
**Must not accept:** student ID as trusted identity, approval status, decision actor, arbitrary timestamps

## 2. `decide-request`
**Caller:** authorized staff  
**Input:** request ID, decision (`approve` or `reject`), optional note  
**Server checks:** staff role and scope, request exists, request still pending  
**Result:** new status, decision timestamp, pass metadata when approved  
**Concurrency:** update only if current status is still pending; write audit record atomically.

## 3. `verify-pass`
**Caller:** authenticated guard  
**Input:** raw QR token  
**Server checks:** token hash match, expiry, revocation, approved request, current exit state  
**Result:** `valid` plus minimal display fields, or a generic failure reason  
**Privacy:** never return unnecessary student data; never return stored token hash.

## 4. `record-exit`
**Caller:** authenticated guard  
**Input:** request/pass reference, confirmation that physical college ID was checked, idempotency key  
**Server checks:** guard role, server-side pass/request state, token validity at exit, ID-check confirmation, no prior exit, no return  
**Result:** exit event ID and server timestamp  
**Atomicity:** gate event and audit event are committed together. A repeated call must not create a second exit.

## 5. `record-return`
**Caller:** authenticated guard  
**Input:** request reference, physical-ID check confirmation if policy requires, idempotency key  
**Server checks:** guard role, existing exit, no existing return, request/event linkage  
**Result:** return event ID and server timestamp  
**Important:** do not require the QR token to remain unexpired for recording a return.

## 6. Error format
Use a consistent structure, for example:
```json
{
  "error": {
    "code": "PASS_EXPIRED",
    "message": "This pass cannot be used for exit."
  }
}
```
Avoid revealing token existence or sensitive details to unauthenticated callers. Log diagnostic detail only on the server without logging secrets.

## 7. Implementation note
These are logical contracts, not implemented endpoints. Confirm Supabase function invocation, transaction strategy, and database constraints during implementation.
