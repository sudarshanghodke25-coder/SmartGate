# SmartGate — Project Documentation

SmartGate is a college gate-pass and student exit/return management Progressive Web App (PWA). It digitizes the existing process in which a student requests permission from authorized staff and presents the approved pass to security at the college gate.

## How to use these documents in Antigravity
1. Extract this folder into the root of your SmartGate code repository.
2. Keep `GEMINI.md` and `ANTIGRAVITY_GUIDE.md` at the repository root.
3. Ask Antigravity to read these documents before changing code.
4. Build in phases. Do not ask the agent to implement the entire system in one prompt.
5. Treat `DECISIONS.md` as the list of policy decisions that need college confirmation.

## Source of truth
If documents conflict, follow this order:
1. Explicit decisions confirmed by the project owner/college
2. `DECISIONS.md`
3. `SRS.md` and `PRD.md`
4. `ARCHITECTURE.md`, `DATABASE_DESIGN.md`, and `API_CONTRACTS.md`
5. UI and implementation notes

Record any change that affects security, policy, data, or workflow in `DECISIONS.md`.

## Proposed stack
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- App type: responsive PWA
- Backend: Supabase Auth, PostgreSQL, Row Level Security (RLS), Edge Functions
- Hosting: Vercel for frontend; Supabase for backend services
- Version control: Git + GitHub

Use free tiers for the student prototype where possible. Confirm current plan limits before deployment.

## MVP roles
- Student
- Approving Staff
- Security Guard
- Administrator

## MVP flow
Student submits a gate-pass request → authorized staff approves/rejects → approved request produces a short-lived QR pass → guard verifies the pass online and checks the physical college ID → guard records exit → guard records return when the student comes back.

## Important boundary
SmartGate supports and records the college's approved process. It must not invent or silently enforce policies that the college has not approved.
