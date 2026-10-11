# Project Charter

## Project name
SmartGate — Smart College Gate-Pass Management System

## Problem statement
The current gate-pass process can rely on paper slips, manual checking, and separate records for approvals, exits, and returns. This may make it harder to verify a pass quickly, trace who approved it, and maintain a consistent record.

## Vision
Provide a simple, auditable digital workflow for requesting, approving, checking, and recording student exits and returns.

## Objectives
- Digitize gate-pass requests and staff decisions.
- Give guards a quick online verification workflow.
- Record exit and return events against the same approved request.
- Provide role-based views and searchable audit history.
- Reduce ambiguity caused by paper passes and manual registers.

## In scope for MVP
- Login and role-based access
- Student profile and college-ID reference
- Request, approve, reject, cancel where policy permits
- QR pass generation and online validation
- Physical college-ID check by security
- Exit and return event recording
- Basic dashboards and audit history
- Responsive, installable PWA
- Tests for core permissions and state transitions

## Out of scope for MVP
- Facial recognition or biometric identification
- GPS tracking of students
- AI risk scores or automatic disciplinary decisions
- Offline gate authorization
- Payments, attendance replacement, or hostel management
- Integrations with college ERP unless separately approved

## Success measures
- A student can submit a request without paper.
- Staff can clearly see pending requests and record a decision.
- A guard can verify an approved pass online and record one exit and one return cycle correctly.
- Unauthorized roles cannot approve passes or record gate events.
- Important actions have an attributable audit record.

## Stakeholders
Students, approving staff, security guards, college administrators, project team, project guide.

## Assumptions
- The college permits a digital prototype and supplies or approves the required policy.
- The college decides which staff can approve, allowed time windows, and what happens in exceptional cases.
- Network access is available at the gate for authorization.

## Main risks
- Unconfirmed gate policies
- Network outage at the gate
- Misconfigured database permissions
- QR screenshots or replay attempts
- Incorrect student identity association
- Student data exposure

## Mitigation
Fail closed if online verification is unavailable; check physical college ID; use short-lived, random QR tokens; enforce authorization in server-side logic and database policies; minimize stored personal data; test permission boundaries.
