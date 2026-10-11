# Antigravity IDE Guide

## Before every task
1. Read `GEMINI.md` and relevant documents under `docs/`.
2. Inspect the existing repository and identify current architecture.
3. Summarize the intended change and list files to create/edit.
4. Identify security and policy implications.
5. Implement the smallest coherent change.
6. Run relevant checks and report the actual output.
7. Update documentation if a requirement, API, schema, or decision changed.

## Required response format for coding tasks
- Understanding
- Files to inspect/change
- Plan
- Security/policy considerations
- Implementation
- Tests/checks actually run
- Remaining issues

## Do not
- Build the entire application in one prompt.
- invent college rules or policy decisions.
- trust client-supplied role, actor ID, request status, or timestamps.
- place secrets in source code or frontend variables.
- use mock data in production paths without clearly marking it.
- add facial recognition, GPS tracking, AI risk scores, or offline authorization without approval.
- silently delete working features or perform unrelated refactors.
- claim deployment, tests, or security review occurred if they did not.

## First prompt
Read `GEMINI.md`, `ANTIGRAVITY_GUIDE.md`, and every file in `docs/`. Do not write code yet. Summarize the requirements, architecture, roles, workflows, security invariants, open policy decisions, and risks. Then propose a phased plan with acceptance criteria. Wait for approval before implementation.
