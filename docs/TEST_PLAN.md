# Test Plan

## 1. Test levels
- Unit tests: validators, state helpers, UI components
- Integration tests: database policies, Edge Functions, authentication
- End-to-end tests: student request → staff decision → guard exit → guard return
- Security tests: role bypass, cross-user access, token replay, concurrency
- Usability tests: mobile guard workflow and accessible forms

## 2. Core test cases
| ID | Scenario | Expected result |
|---|---|---|
| SG-001 | Student submits valid request | Request becomes pending |
| SG-002 | Student submits empty/invalid required fields | Validation error; no request created |
| SG-003 | Student tries to approve a request | Denied |
| SG-004 | Student tries to read another student's request | Denied |
| SG-005 | Unauthorized staff tries to decide request | Denied |
| SG-006 | Authorized staff approves pending request | Approved with actor/time audit |
| SG-007 | Two staff decisions race on same request | Only one valid decision succeeds |
| SG-008 | Guard verifies valid pass online | Minimal details returned |
| SG-009 | Expired/revoked/invalid pass used for exit | Exit denied |
| SG-010 | Physical ID confirmation is not completed | Exit denied |
| SG-011 | Valid pass records exit | Exactly one exit event |
| SG-012 | Same exit call is retried | No duplicate exit event |
| SG-013 | Return attempted before exit | Denied |
| SG-014 | Return recorded after a valid exit | Exactly one return event |
| SG-015 | Return attempted after QR expiry but active exit exists | Allowed if all return policy checks pass |
| SG-016 | Verification server/network unavailable | No app authorization |
| SG-017 | Student tries to update audit log | Denied |
| SG-018 | Frontend role is tampered with | Sensitive operation still denied |
| SG-019 | Guard requests unnecessary profile data | Denied or fields omitted |
| SG-020 | QR token is present in logs | Test must fail; raw token must not be logged |

## 3. Definition of done
- Acceptance criteria from `PRD.md` pass.
- RLS is enabled and tested for all client-accessible tables.
- Sensitive state transitions are server-side and atomic.
- No service-role key or secret is included in frontend build or repository.
- Build, lint, and tests pass in the target environment.
- Known limitations and unconfirmed policy choices are documented.
- Demo uses synthetic student data unless the college approves real data use.
