# SmartGate v3 — Complete UI Overhaul, Dedicated Role Login Modules, Official Pass Receipts & Real Mobile/Guard QR Database Sync

SmartGate will be completely redesigned with an intuitive, high-clarity user interface, four dedicated role authentication & registration modules (`Student`, `Staff`, `Guard`, `Admin`) with duplicate registration prevention, accurate real-time date/time tracking, official printable Gate Pass Receipts, and real mobile-scannable QR codes that also scan directly inside the Guard software to write exit/return entries straight into the database.

### User Review & Critical Decisions

> [!IMPORTANT]
> Please review the following core upgrades designed from your instructions before we execute the build:

- **4 Dedicated Role Login & Registration Modules**:
  - Separate, purpose-built login views for **Student**, **Staff / Faculty**, **Security Guard**, and **Administrator**, plus a fast "Quick Switch / Demo Fill" bar so you can either log in/register with real forms or jump between roles in one click.
  - **Student Registration with Duplicate Prevention**: Collects complete student credentials (Full Name, unique Student ID / Roll Number, College Email, Department, Academic Year, Mobile Number, Parent/Guardian Emergency Phone, Residence Type) and strictly blocks repeated registrations with the same Roll Number, Student ID, or Email.
- **Official Gate Pass Receipt Generation**:
  - Validated student registration data automatically populates an **Official College Gate Pass Receipt** (with Receipt Serial #, Student ID, Department, Exact Leave/Return Date & Time, Faculty Approver Stamp, Gate Entry/Exit Timestamps, and Scannable QR).
- **Accurate Real-Time Date & Time Engine**:
  - Replaces placeholder strings (`"Today"`, `"Just now"`) with a live ticking campus clock and real calendar date/time pickers (`DD MMM YYYY, hh:mm:ss A`) across all requests, pass receipts, gate logs, and audit records.
- **Real Mobile-Scannable QR + Direct Guard Software Scanner**:
  - Uses standards-compliant QR code encoding (`qrcode` + `jsqr` / `BarcodeDetector` optical decoding) so QR passes can be scanned by **any smartphone camera** (displaying the formatted pass verification receipt) AND scanned directly by the **Guard Terminal camera / image / in-app scanner** to immediately record the exit or return entry into the database.

---

### 1. Overview & Core Concept

- **What It Does**:
  1. **Unified Role Gateway & Authentication Portal**: Users select their portal (**Student**, **Staff**, **Guard**, or **Admin**). New students can register their full academic profile (with strict duplicate ID/Roll No/Email validation), while returning users sign in or use 1-click quick credentials.
  2. **Student Module**: Guided step-by-step pass request wizard with real date/time pickers, live approval status tracker, interactive **Official Gate Pass Receipt**, and a **Mobile-Scannable QR Pass**.
  3. **Staff Module**: Clean departmental approval workspace showing full student profile verification, attendance/pass history, emergency SOS priority queue, batch approval, and one-click decision stamps.
  4. **Guard Module**: High-contrast security checkpoint terminal with a **Live Optical QR Camera Scanner** (decoding real QR codes from a student's phone screen or uploaded QR image), 1-click software scanner sync, physical ID card verification, and direct database entry logging.
  5. **Admin Module**: Central database registry of all registered students, staff, and guards (with duplicate prevention logs), real-time campus occupancy analytics, overdue curfew watchlist, CSV exports, and campus policy management.

---

### 2. User Experience & Visual Design

- **Complete UI Overhaul (Easy to Understand & Usable)**:
  - *Visual Clarity & Theme Switcher*: Supports both a crisp **High-Contrast Daylight Institutional Theme** (clean alabaster/white surfaces `#F8FAFC` with deep navy typography for effortless daytime readability) and a **Refined Command Dark Theme** (`#0B0F19`), switchable anytime from the top bar.
  - *Role-Specific Visual Identity*:
    - **Student Portal**: Royal Blue (`#2563EB`) accent — friendly, guided step-by-step cards and clear receipt views.
    - **Staff Desk**: Indigo (`#4F46E5`) accent — structured review queue with clear Approve / Decline action bars.
    - **Guard Terminal**: Emerald (`#059669`) accent — bold, oversized touch-friendly scanner controls and unmistakable green/red verification banners.
    - **Admin Console**: Slate/Violet (`#7C3AED`) accent — clean data registries, student directory management, and visual charts.
  - *Typography & Scannability*: `Plus Jakarta Sans` for crisp human-readable labels and headings paired with `JetBrains Mono` (`tabular-nums`) for Student IDs, Roll Numbers, Receipt Numbers, and live timestamps.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Strict Duplicate Prevention on Student & Staff Registration**
  - *Chosen Approach*: The database maintains a persistent `users` registry indexed by normalized `rollNo`, `studentId`, and `email`. Attempting to register a duplicate Roll Number (e.g. `CO-2024-042`) or email immediately highlights the conflict and prevents duplicate entries.
  - *Why*: Ensures every Gate Pass Receipt maps to a single, verifiable student identity in the database.
- **Decision 2: Dual-Compatible Real QR Code (Smartphone + Guard Terminal)**
  - *Chosen Approach*: Encode a real ISO-standard QR code containing both a human-readable verification summary and a machine-parseable JSON/token payload, paired with real optical frame decoding (`jsQR` / HTML5 canvas frame reader) in the Guard Terminal.
  - *Why*: Scanning the QR with a regular mobile phone shows the student's pass receipt details, while scanning it with the Guard Terminal webcam (or uploading/clicking the QR) decodes the token and writes the Exit/Return record directly into the database.
- **Decision 3: Real-Time ISO & Formatted Timestamps**
  - *Chosen Approach*: Store ISO-8601 timestamps (`createdAtISO`, `leaveTimeISO`, `expectedReturnISO`, `exitTimeISO`, `returnTimeISO`) alongside formatted local date/time strings (`22 Oct 2026, 02:30 PM`).
  - *Why*: Guarantees accurate date/time display, exact duration calculations, and automatic overdue curfew detection.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                 SmartGate Header (Live Clock · Theme Toggle · Auth)          │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│            Dedicated 4-Role Auth & Registration Gateway                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Student Auth │  │  Staff Auth  │  │  Guard Auth  │  │    Admin Auth    │  │
│  │ + Register   │  │ + Dept Scope │  │ + Gate Shift │  │ + Master Control │  │
│  │ (No Dup IDs) │  │              │  │              │  │                  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼─────────────────┼───────────────────┼────────────┘
          │                 │                 │                   │
          ▼                 ▼                 ▼                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│           Persistent Campus Database Store (Users, Passes, Events, Audits)   │
│  • Validated Users Table (Unique Roll No / Student ID / Email enforcement)   │
│  • Gate Passes & Official Receipts (Exact ISO Dates, Approver, QR Payload)   │
│  • Direct Guard Scan Sync (Optical Camera QR Decoder -> Database Entry)      │
└──────┬────────────────────┬──────────────────────┬────────────────────┬──────┘
       │                    │                      │                    │
       ▼                    ▼                      ▼                    ▼
┌──────────────┐    ┌───────────────┐     ┌─────────────────┐   ┌──────────────┐
│Student Module│    │  Staff Module │     │  Guard Module   │   │ Admin Module │
├──────────────┤    ├───────────────┤     ├─────────────────┤   ├──────────────┤
│• Guided Pass │    │• Pending &    │     │• Real Optical   │   │• Registered  │
│  Request Form│    │  SOS Triage   │     │  QR Camera Scan │   │  Student DB  │
│• Official    │    │• Student ID & │     │• Direct DB Exit │   │• Pass & Gate │
│  Pass Receipt│    │  Parent Info  │     │  & Return Entry │   │  Registries  │
│• Real Mobile │    │• One-Click &  │     │• S6 Physical ID │   │• Analytics & │
│  Scannable QR│    │  Batch Approve│     │  Verification   │   │  CSV Export  │
└──────────────┘    └───────────────┘     └─────────────────┘   └──────────────┘
```

- **Data Model & State**:
  - `RegisteredUser`: `id`, `role` (`student` | `staff` | `guard` | `admin`), `name`, `email`, `passwordPin`, `rollNo` (unique for students), `studentId` (unique college ID, e.g., `SG-STU-2026-042`), `staffId`, `department`, `year`, `semester`, `phone`, `guardianName`, `guardianPhone`, `residenceType` (`Hostel` | `Day Scholar`), `hostelDetails`, `bloodGroup`, `registeredAt`.
  - `GatePassRequest`: Includes `receiptNumber` (`RCPT-2026-XXXX`), `studentId`, `studentRollNo`, `studentName`, `department`, `year`, `phone`, `guardianName`, `guardianPhone`, `residenceType`, `leaveDateTimeISO`, `expectedReturnDateTimeISO`, `createdAtISO`, `decidedAtISO`, `actualExitTimeISO`, `actualReturnTimeISO`, `qrPayloadString`, and full receipt metadata.
- **Interactive Component & State Mapping**:
  - **Auth & Registration Gateway**: Switching between `Student`, `Staff`, `Guard`, and `Admin` login tabs changes the form fields and visual theme; Student Registration validates uniqueness of `rollNo`, `studentId`, and `email` against the database before creating the student profile and auto-generating their digital ID card.
  - **Student Pass & Receipt Flow**: Submitting a request records exact ISO dates and generates a receipt; once approved, the student opens the **Official Gate Pass Receipt & QR Modal** featuring a real mobile-scannable QR code (rendered via `qrcode` library) and printable receipt layout.
  - **Guard Optical QR & Direct Database Entry**: Guard scans the QR via webcam (`jsQR` real-time video frame decoder), uploads a QR image, or selects from active passes; the software immediately pulls the student's database record, displays their photo/ID/receipt details, and logs the Exit or Return timestamp directly into the database.
