# Database Design

This is a proposed logical schema. Refine it through SQL migrations and test RLS policies before using real student data.

## 1. `profiles`
- `id uuid primary key references auth.users(id)`
- `full_name text not null`
- `college_id_number text` (store only if approved and needed)
- `role text not null` — constrained to `student`, `staff`, `guard`, `admin`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Role assignment must not be self-service. Protect role changes with a trusted admin workflow.

## 2. `gate_pass_requests`
- `id uuid primary key`
- `student_id uuid not null references profiles(id)`
- `reason text not null`
- `destination text null` (only if approved as necessary)
- `expected_return_at timestamptz null`
- `status text not null` — `pending`, `approved`, `rejected`, `cancelled`, `expired`, `completed`
- `decided_by uuid null references profiles(id)`
- `decided_at timestamptz null`
- `decision_note text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Add database constraints for valid statuses and reasonable input lengths. Define allowed transitions in server-side logic.

## 3. `pass_tokens`
- `id uuid primary key`
- `request_id uuid not null references gate_pass_requests(id)`
- `token_hash text not null unique`
- `expires_at timestamptz not null`
- `revoked_at timestamptz null`
- `created_at timestamptz not null default now()`

Generate a cryptographically random raw token server-side, deliver/display it once, and store only a secure hash. Never log the raw token. If the selected QR design uses signed tokens instead, document the key rotation and validation approach.

## 4. `gate_events`
- `id uuid primary key`
- `request_id uuid not null references gate_pass_requests(id)`
- `event_type text not null` — `exit` or `return`
- `recorded_by uuid not null references profiles(id)`
- `recorded_at timestamptz not null default now()`
- `idempotency_key text null`
- `notes text null`

Use a transaction/function and appropriate unique constraints to prevent duplicate exit or return events for a request cycle. Define whether multiple trips per request are allowed; MVP assumes one exit and one return per approved pass.

## 5. `audit_logs`
- `id uuid primary key`
- `actor_id uuid null references profiles(id)`
- `action text not null`
- `entity_type text not null`
- `entity_id uuid null`
- `occurred_at timestamptz not null default now()`
- `metadata jsonb not null default '{}'::jsonb`

Do not store passwords, auth tokens, raw QR tokens, or unnecessary sensitive personal data in metadata. Ordinary users must not be able to update/delete audit rows.

## 6. Relationships
- One profile/student can have many requests.
- One request has zero or one active pass token (implementation may retain revoked/old token rows).
- One request has gate events.
- Audit logs reference actions on requests, profiles, and gate events.

## 7. RLS policy principles
- Student can read their own profile fields and their own requests.
- Student can create a request only for themselves; cannot set approval fields or privileged statuses.
- Staff can read and decide requests only within their approved scope.
- Guard can invoke verification and gate-event functions but should not have broad read access to student data.
- Admin operations are limited to authorized administrators.
- Client users cannot write audit logs directly; trusted functions write them.
- Deny by default and test each role with both allowed and forbidden operations.

Do not copy these as production SQL without checking Supabase policy syntax, concurrency behavior, and college policy.
