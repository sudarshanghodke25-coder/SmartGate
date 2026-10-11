import { useState } from 'react'
import { ShieldCheck, GraduationCap, Briefcase, Shield, Settings, Sparkles } from 'lucide-react'
import type { UserRole, GatePassRequest, GateEvent, AuditEvent } from '../types'
import {
  MOCK_USERS,
  INITIAL_MOCK_REQUESTS,
  INITIAL_MOCK_GATE_EVENTS,
  INITIAL_MOCK_AUDIT_LOGS,
} from '../lib/mockData'
import { StudentDashboard } from '../features/student/StudentDashboard'
import { StaffDashboard } from '../features/staff/StaffDashboard'
import { GuardDashboard } from '../features/guard/GuardDashboard'
import { AdminDashboard } from '../features/admin/AdminDashboard'

export const AppShell = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('student')
  const [requests, setRequests] = useState<GatePassRequest[]>(INITIAL_MOCK_REQUESTS)
  const [gateEvents, setGateEvents] = useState<GateEvent[]>(INITIAL_MOCK_GATE_EVENTS)
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(INITIAL_MOCK_AUDIT_LOGS)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const currentUser = MOCK_USERS[currentRole]

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Handle student request creation
  const handleRequestCreate = (newReq: Partial<GatePassRequest>) => {
    const newId = `req_${Date.now().toString().slice(-4)}`
    const passNum = `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`
    const created: GatePassRequest = {
      id: newId,
      passNumber: passNum,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentRollNo: currentUser.rollNo || 'CO-2024-042',
      department: newReq.department || 'Computer Engineering',
      year: newReq.year || 'Year 3 (Diploma)',
      reason: newReq.reason || '',
      destination: newReq.destination || '',
      leaveTime: newReq.leaveTime || 'Today',
      expectedReturnTime: newReq.expectedReturnTime || 'Today',
      status: 'pending',
      gateState: 'no_exit',
      createdAt: 'Just now',
    }

    setRequests([created, ...requests])

    // Log audit event
    const audit: AuditEvent = {
      id: `aud_${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      entityType: 'gate_pass',
      entityId: newId,
      action: 'create_request',
      actorId: currentUser.id,
      actorName: `${currentUser.name} (Student)`,
      actorRole: 'student',
      metadata: {
        passNumber: passNum,
        reason: newReq.reason || '',
      },
    }
    setAuditLogs([audit, ...auditLogs])
    showToast(`Request ${passNum} created successfully! Switch to Staff to review.`)
  }

  // Handle staff approval/rejection
  const handleStaffDecision = (
    requestId: string,
    decision: 'approved' | 'rejected',
    note: string,
  ) => {
    const updated = requests.map((r) => {
      if (r.id === requestId) {
        const qrCode =
          decision === 'approved'
            ? `SG-${r.passNumber.slice(-3)}-${Math.random()
                .toString(36)
                .substring(2, 6)
                .toUpperCase()}`
            : undefined

        return {
          ...r,
          status: decision,
          decisionNote: note,
          decidedBy: currentUser.id,
          decidedByName: currentUser.name,
          decidedAt: 'Just now',
          qrToken: qrCode,
          qrExpiresAt: 'Today, 06:00 PM',
        }
      }
      return r
    })

    setRequests(updated)

    const reqItem = requests.find((r) => r.id === requestId)
    if (reqItem) {
      const audit: AuditEvent = {
        id: `aud_${Date.now().toString().slice(-4)}`,
        timestamp: 'Just now',
        entityType: 'gate_pass',
        entityId: requestId,
        action: decision === 'approved' ? 'approve_request' : 'reject_request',
        actorId: currentUser.id,
        actorName: `${currentUser.name} (Faculty)`,
        actorRole: 'staff',
        metadata: {
          passNumber: reqItem.passNumber,
          decision,
          note,
        },
      }
      setAuditLogs([audit, ...auditLogs])
    }

    showToast(
      `Pass ${decision === 'approved' ? 'Approved & QR Issued' : 'Rejected'}. Logged to audit trail.`,
    )
  }

  // Handle guard recording exit
  const handleRecordExit = (requestId: string, physicalConfirmed: boolean) => {
    const req = requests.find((r) => r.id === requestId)
    if (!req) return

    const updated = requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            gateState: 'exited' as const,
            actualExitTime: 'Just now',
          }
        : r,
    )
    setRequests(updated)

    // Add gate event
    const newGateEvent: GateEvent = {
      id: `evt_${Date.now().toString().slice(-4)}`,
      requestId,
      passNumber: req.passNumber,
      studentName: req.studentName,
      studentRollNo: req.studentRollNo,
      eventType: 'exit',
      timestamp: 'Just now',
      guardId: currentUser.id,
      guardName: currentUser.name,
      gateLocation: 'Main Gate (Gate 1)',
      physicalIdConfirmed: physicalConfirmed,
      note: `Physical College ID match confirmed. Student exited campus.`,
    }
    setGateEvents([newGateEvent, ...gateEvents])

    // Add audit entry
    const audit: AuditEvent = {
      id: `aud_${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      entityType: 'gate_event',
      entityId: newGateEvent.id,
      action: 'record_exit',
      actorId: currentUser.id,
      actorName: `${currentUser.name} (Guard)`,
      actorRole: 'guard',
      metadata: {
        passNumber: req.passNumber,
        studentRollNo: req.studentRollNo,
        physicalIdConfirmed: physicalConfirmed,
      },
    }
    setAuditLogs([audit, ...auditLogs])
    showToast(`Exit authorized and recorded for ${req.studentName}.`)
  }

  // Handle guard recording return
  const handleRecordReturn = (requestId: string, physicalConfirmed: boolean) => {
    const req = requests.find((r) => r.id === requestId)
    if (!req) return

    const updated = requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'completed' as const,
            gateState: 'returned' as const,
            actualReturnTime: 'Just now',
          }
        : r,
    )
    setRequests(updated)

    // Add gate event
    const newGateEvent: GateEvent = {
      id: `evt_${Date.now().toString().slice(-4)}`,
      requestId,
      passNumber: req.passNumber,
      studentName: req.studentName,
      studentRollNo: req.studentRollNo,
      eventType: 'return',
      timestamp: 'Just now',
      guardId: currentUser.id,
      guardName: currentUser.name,
      gateLocation: 'Main Gate (Gate 1)',
      physicalIdConfirmed: physicalConfirmed,
      note: `Safe return to campus confirmed via physical ID check.`,
    }
    setGateEvents([newGateEvent, ...gateEvents])

    // Add audit entry
    const audit: AuditEvent = {
      id: `aud_${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      entityType: 'gate_event',
      entityId: newGateEvent.id,
      action: 'record_return',
      actorId: currentUser.id,
      actorName: `${currentUser.name} (Guard)`,
      actorRole: 'guard',
      metadata: {
        passNumber: req.passNumber,
        studentRollNo: req.studentRollNo,
        physicalIdConfirmed: physicalConfirmed,
      },
    }
    setAuditLogs([audit, ...auditLogs])
    showToast(`Return logged for ${req.studentName}. Pass completed.`)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Banner: Prototype & Security Invariant Disclosure */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border-b border-blue-500/20 px-4 py-1.5 text-[11px] text-blue-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-ping" />
          <span className="font-semibold text-white">SmartGate Prototype</span>
          <span className="hidden sm:inline text-blue-300">
            — Phase 1 UI Shell with Interactive Mock Engine
          </span>
        </div>
        <div className="text-[10px] text-blue-300 font-mono">
          Non-Negotiable: In production, server/DB RLS is the single source of truth (S1-S4)
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-lg tracking-tight">SmartGate</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none hidden sm:block">
                College Gate-Pass & Exit/Return System
              </p>
            </div>
          </div>

          {/* Interactive Role Switcher Pills (Allows testing all 4 roles) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 px-2 hidden md:inline">
              Role View:
            </span>
            <button
              onClick={() => setCurrentRole('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentRole === 'student'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap size={14} />
              <span>Student</span>
            </button>

            <button
              onClick={() => setCurrentRole('staff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentRole === 'staff'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Briefcase size={14} />
              <span>Staff</span>
            </button>

            <button
              onClick={() => setCurrentRole('guard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentRole === 'guard'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield size={14} />
              <span>Guard</span>
            </button>

            <button
              onClick={() => setCurrentRole('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings size={14} />
              <span>Admin</span>
            </button>
          </div>

          {/* User Profile Badge */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <span className="font-semibold text-white text-xs block">{currentUser.name}</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {currentUser.rollNo || currentUser.staffId}
              </span>
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
              {currentUser.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-blue-500/40 text-blue-200 text-xs shadow-2xl">
            <Sparkles size={16} className="text-blue-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main View Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentRole === 'student' && (
          <StudentDashboard
            user={currentUser}
            requests={requests}
            onRequestCreate={handleRequestCreate}
          />
        )}

        {currentRole === 'staff' && (
          <StaffDashboard user={currentUser} requests={requests} onDecision={handleStaffDecision} />
        )}

        {currentRole === 'guard' && (
          <GuardDashboard
            user={currentUser}
            requests={requests}
            gateEvents={gateEvents}
            onRecordExit={handleRecordExit}
            onRecordReturn={handleRecordReturn}
          />
        )}

        {currentRole === 'admin' && (
          <AdminDashboard
            user={currentUser}
            requests={requests}
            gateEvents={gateEvents}
            auditLogs={auditLogs}
          />
        )}
      </main>

      {/* Footer with Project Credentials & Policies */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-slate-400" />
            <span>SmartGate — Diploma Engineering Gate Pass Management System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Fail Closed (S5)</span>
            <span>•</span>
            <span>Physical ID Check (S6)</span>
            <span>•</span>
            <span>Immutable Audit (S10)</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
