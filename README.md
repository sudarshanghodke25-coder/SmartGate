# SmartGate — Secure Campus Gate-Pass & Exit/Return Management System

> A modern, progressive web application (PWA) designed for collegiate institutions to streamline student gate passes, enforce digital verification, and maintain an immutable campus audit trail.

---

## Overview

**SmartGate** replaces fragile manual paper registers with an end-to-end digital lifecycle for campus movement. The application integrates multi-role operational dashboards with strict security invariants to ensure that college security and administrative oversight remain reliable and auditable.

---

## Key Features & Role Portals

| Role | Responsibilities | Key Capabilities |
| :--- | :--- | :--- |
| **Student** | Exit Requests & Passes | Create digital gate-pass requests, specify destination/return times, view approval status, and present dynamic QR tokens. |
| **Faculty / Staff** | Review & Authorization | Department-scoped approval desk, review reasons and expected return times, add decision notes, and issue authorized passes. |
| **Security Guard** | Gate Verification | Real-time QR / token verification, mandatory physical college ID cross-checking, single-exit cycle enforcement, and return recording. |
| **Administrator** | Governance & Audit | Live campus departure census, active off-campus tracking, tamper-evident audit logs, and compliance oversight. |

---

## Security Invariants

SmartGate enforces strict operational and security principles:

1. **Fail-Closed Gate Verification**: Online verification is required to authorize student exit. If network connectivity is unavailable, the application strictly fails closed, preventing unverified exits.
2. **Mandatory Physical ID Cross-Verification**: Gate personnel must visually confirm the physical college ID card matching the digital pass before granting exit.
3. **Single Exit Per Cycle**: An approved pass can generate at most one exit event. Replay attempts on already exited passes are rejected.
4. **Guaranteed Return Lifecycle**: Return requests require an existing, recorded exit and remain recordable even if the initial QR token validity window has passed.
5. **Tamper-Evident Audit Logging**: Every critical state transition (request creation, staff decision, exit scan, and return) is logged with actor metadata.

---

## Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **Iconography**: Lucide React
- **Architecture**: Progressive Web App (PWA) ready with Supabase PostgreSQL & Row Level Security (RLS) integration

---

## Project Structure

```text
SmartGate/
├── public/                 # Static assets, icons, and web app manifest
│   ├── favicon.svg
│   ├── icons.svg
│   └── manifest.json
├── src/
│   ├── assets/             # Project brand assets
│   ├── components/         # Reusable application components (AppShell, StatusBadge)
│   ├── features/           # Role-based feature modules
│   │   ├── admin/          # Central administration & audit log desk
│   │   ├── guard/          # Gate scanner & verification terminal
│   │   ├── staff/          # Faculty approval & decision modals
│   │   └── student/        # Pass request generator & active QR viewer
│   ├── lib/                # Utility helpers and mock demonstration datasets
│   ├── types/              # Comprehensive TypeScript interfaces & domain types
│   ├── App.tsx             # Root application coordinator
│   ├── index.css           # Tailwind design tokens and base styles
│   └── main.tsx            # React application entry point
├── supabase/               # Database migrations & backend function specs
├── .env.example            # Environment configuration reference template
├── .gitignore              # Production-grade git exclusion rules
├── package.json            # Dependencies and development scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build pipeline setup
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **pnpm**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/smartgate.git
   cd smartgate
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   *(Update `.env` with your Supabase credentials or backend endpoints. Note that `.env` is strictly excluded from version control).*

4. Start the local development server:
   ```bash
   npm run dev
   ```

---

## Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Launches the local Vite development server with HMR |
| `npm run build` | Runs TypeScript compilation (`tsc -b`) and builds production bundle |
| `npm run lint` | Runs ESLint across the codebase |
| `npm run format` | Formats code with Prettier |
| `npm run preview` | Previews the production build locally |

---

## Engineering Standards

- All components are strictly typed with TypeScript.
- Server-side database authentication and Row Level Security are the source of truth; client state is never solely trusted for authorization.
- Zero secrets or service-role keys are exposed in client-side code.
