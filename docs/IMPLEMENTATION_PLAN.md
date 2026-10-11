# Implementation Plan

Build one vertical slice at a time. Do not implement every feature in one large change.

## Phase 0 — Repository and requirements
- Read all docs and summarize unresolved policy questions.
- Confirm React/TypeScript/Vite, Tailwind, Supabase, PWA approach.
- Create repository, linting, formatting, environment example, and CI checks.
**Exit criteria:** project runs locally; no secrets committed.

## Phase 1 — UI shell and mock data
- Build responsive layout, role-aware navigation, design tokens, status components.
- Use mock data only; do not pretend the mock flow is secure.
**Exit criteria:** screens are navigable and responsive.

## Phase 2 — Authentication and profiles
- Configure Supabase Auth and profile bootstrap.
- Implement role-aware routing for user experience.
- Create and test server/database permissions.
**Exit criteria:** login works; role cannot be changed by client; unauthorized access tests pass.

## Phase 3 — Student request flow
- Create request form, request list/detail, and status handling.
- Add validation and RLS.
**Exit criteria:** students can create/read only their own requests.

## Phase 4 — Staff decision flow
- Implement pending queue and trusted approve/reject operation.
- Add audit event in the same transaction/atomic workflow.
**Exit criteria:** only authorized staff can decide pending requests; concurrent decisions are safe.

## Phase 5 — QR issuance and online verification
- Implement secure random token generation, hash storage, expiry/revocation, scanner/manual entry.
- Implement online verification and minimal guard response.
**Exit criteria:** invalid, expired, revoked, and rejected passes cannot proceed.

## Phase 6 — Exit and return events
- Implement atomic, idempotent exit/return operations.
- Ensure return does not depend on QR being unexpired once an active exit exists.
**Exit criteria:** one exit and one return per request cycle; invalid transitions are denied.

## Phase 7 — Admin, audit, and polish
- Add approved admin features, audit filters, loading/error/empty states, accessibility.
- Avoid expanding scope without a documented decision.
**Exit criteria:** role permissions and audit access tests pass.

## Phase 8 — Verification and demo
- Run unit, integration, E2E, RLS, and concurrency tests.
- Deploy a demo with synthetic data.
- Prepare setup guide, known limitations, and project presentation.
**Exit criteria:** acceptance criteria pass and demo is reproducible.

## Rules for every phase
- Inspect existing code before editing.
- Explain planned files and impact before broad refactors.
- Keep changes small and reviewable.
- Run relevant tests and report exact results.
- Never claim a test/build succeeded unless it was actually run.
