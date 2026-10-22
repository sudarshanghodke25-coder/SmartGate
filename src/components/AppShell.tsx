import { useState, useEffect } from 'react'
import {
  RotateCcw,
  Users,
  AlertTriangle,
  Flame,
  CheckCircle2,
  UserPlus,
  Clock,
  Sun,
  Moon,
  ShieldCheck,
  QrCode,
  FileSpreadsheet,
  Download,
} from 'lucide-react'
import type {
  UserRole,
  UserProfile,
  GatePassRequest,
  GateEvent,
  AuditEvent,
  GateLocation,
  CampusPolicyConfig,
} from '../types'
import {
  MOCK_PROFILES,
  INITIAL_MOCK_REQUESTS,
  INITIAL_MOCK_GATE_EVENTS,
  INITIAL_MOCK_AUDIT_LOGS,
  DEFAULT_POLICIES,
} from '../lib/mockData'
import {
  computeAuditHash,
  generateActionStamp,
  formatAccurateDateTime,
} from '../lib/qrAndExport'
import { StudentDashboard } from '../features/student/StudentDashboard'
import { StaffDashboard } from '../features/staff/StaffDashboard'
import { GuardDashboard } from '../features/guard/GuardDashboard'
import { AdminDashboard } from '../features/admin/AdminDashboard'
import { RoleAuthModal } from '../features/auth/RoleAuthModal'

const STORAGE_KEYS = {
  users: 'smartgate_v3_users',
  requests: 'smartgate_v3_requests',
  events: 'smartgate_v3_events',
  audits: 'smartgate_v3_audits',
  policies: 'smartgate_v3_policies',
  role: 'smartgate_v3_role',
  userId: 'smartgate_v3_user_id',
  theme: 'smartgate_v3_theme',
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const AppShell = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    loadFromStorage<'light' | 'dark'>(STORAGE_KEYS.theme, 'dark'),
  )
  const [users, setUsers] = useState<UserProfile[]>(() =>
    loadFromStorage<UserProfile[]>(STORAGE_KEYS.users, MOCK_PROFILES),
  )
  const [currentRole, setCurrentRole] = useState<UserRole>(() =>
    loadFromStorage<UserRole>(STORAGE_KEYS.role, 'student'),
  )
  const [selectedUserId, setSelectedUserId] = useState<string>(() =>
    loadFromStorage<string>(STORAGE_KEYS.userId, 'usr_student_01'),
  )
  const [requests, setRequests] = useState<GatePassRequest[]>(() =>
    loadFromStorage<GatePassRequest[]>(STORAGE_KEYS.requests, INITIAL_MOCK_REQUESTS),
  )
  const [gateEvents, setGateEvents] = useState<GateEvent[]>(() =>
    loadFromStorage<GateEvent[]>(STORAGE_KEYS.events, INITIAL_MOCK_GATE_EVENTS),
  )
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(() =>
    loadFromStorage<AuditEvent[]>(STORAGE_KEYS.audits, INITIAL_MOCK_AUDIT_LOGS),
  )
  const [policies, setPolicies] = useState<CampusPolicyConfig>(() =>
    loadFromStorage<CampusPolicyConfig>(STORAGE_KEYS.policies, DEFAULT_POLICIES),
  )
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [initialScanToken, setInitialScanToken] = useState<string | null>(null)
  const [liveClock, setLiveClock] = useState<string>(() =>
    formatAccurateDateTime(new Date(), true),
  )
  const [toastMessage, setToastMessage] = useState<{
    text: string
    targetRole?: UserRole
  } | null>(null)

  // Live ticking campus clock
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveClock(formatAccurateDateTime(new Date(), true))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Sync theme class on document root
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
      localStorage.setItem(STORAGE_KEYS.requests, JSON.stringify(requests))
      localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(gateEvents))
      localStorage.setItem(STORAGE_KEYS.audits, JSON.stringify(auditLogs))
      localStorage.setItem(STORAGE_KEYS.policies, JSON.stringify(policies))
      localStorage.setItem(STORAGE_KEYS.role, JSON.stringify(currentRole))
      localStorage.setItem(STORAGE_KEYS.userId, JSON.stringify(selectedUserId))
      localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme))
    } catch {
      // Ignore storage quota errors in private browsing
    }
  }, [users, requests, gateEvents, auditLogs, policies, currentRole, selectedUserId, theme])

  const roleProfiles = users.filter((p) => p.role === currentRole)
  const currentUser =
    roleProfiles.find((p) => p.id === selectedUserId) || roleProfiles[0] || users[0]

  const handleRoleSwitch = (role: UserRole) => {
    setCurrentRole(role)
    const firstForRole = users.find((p) => p.role === role)
    if (firstForRole) {
      setSelectedUserId(firstForRole.id)
    }
  }

  const handleSelectUserFromAuth = (user: UserProfile) => {
    setCurrentRole(user.role)
    setSelectedUserId(user.id)
    showToast(`Signed in to ${user.role.toUpperCase()} module as ${user.name}.`)
  }

  const showToast = (text: string, targetRole?: UserRole) => {
    setToastMessage({ text, targetRole })
    setTimeout(() => setToastMessage(null), 5000)
  }

  const appendAudit = (
    entityType: AuditEvent['entityType'],
    entityId: string,
    action: AuditEvent['action'],
    metadata: AuditEvent['metadata'],
    actorOverride?: UserProfile,
  ) => {
    const stamp = generateActionStamp('aud')
    const actor = actorOverride || currentUser
    const prevHash =
      auditLogs[0]?.hash || '0000000000000000000000000000000000000000000000000000000000000000'
    const payload = `${stamp.id}:${action}:${entityId}:${actor.id}:${JSON.stringify(metadata)}`
    const hash = computeAuditHash(prevHash, payload)

    const audit: AuditEvent = {
      id: stamp.id,
      timestamp: stamp.timeWithSeconds,
      timestampISO: stamp.isoString,
      entityType,
      entityId,
      action,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      prevHash,
      hash,
      metadata,
    }
    setAuditLogs((prev) => [audit, ...prev])
  }

  const handleRegisterUser = (newUser: UserProfile) => {
    setUsers((prev) => [newUser, ...prev])
    setCurrentRole(newUser.role)
    setSelectedUserId(newUser.id)
    appendAudit(
      'user',
      newUser.id,
      'register_user',
      {
        role: newUser.role,
        name: newUser.name,
        rollNoOrId: newUser.rollNo || newUser.staffId || newUser.id,
        studentId: newUser.studentId || 'N/A',
        email: newUser.email,
      },
      newUser,
    )
    showToast(
      `Registered ${newUser.name} (${newUser.studentId || newUser.rollNo || newUser.staffId}) & signed in!`,
    )
  }

  const handleJumpToGuardScan = (token: string) => {
    const guardUser = users.find((u) => u.role === 'guard')
    if (guardUser) {
      setSelectedUserId(guardUser.id)
    }
    setCurrentRole('guard')
    setInitialScanToken(token)
    showToast('Switched to Guard Scanner & decoded QR pass into verification terminal.')
  }

  const handleRequestCreate = (newReq: Partial<GatePassRequest>) => {
    const stamp = generateActionStamp('req')

    const created: GatePassRequest = {
      id: stamp.id,
      passNumber: stamp.passNumber,
      receiptNumber: stamp.receiptNumber,
      studentId: currentUser.id,
      collegeStudentId:
        newReq.collegeStudentId || currentUser.studentId || 'STU-2026-1042',
      studentName: currentUser.name,
      studentRollNo: currentUser.rollNo || 'CO-2024-042',
      studentPhone: newReq.studentPhone || currentUser.phone || '+91 98201 11223',
      department: newReq.department || currentUser.department || 'Computer Engineering',
      year: newReq.year || currentUser.year || 'Year 3 (Diploma)',
      category: newReq.category || 'academic',
      priority: newReq.priority || 'normal',
      reason: newReq.reason || '',
      destination: newReq.destination || '',
      leaveTime: newReq.leaveTime || stamp.timeLabel,
      expectedReturnTime: newReq.expectedReturnTime || stamp.timeLabel,
      leaveDateTimeISO: newReq.leaveDateTimeISO,
      expectedReturnDateTimeISO: newReq.expectedReturnDateTimeISO,
      guardianName: newReq.guardianName || currentUser.guardianName || 'Rajesh Sharma',
      guardianPhone: newReq.guardianPhone || currentUser.guardianPhone || '+91 98201 44510',
      residenceType: newReq.residenceType || currentUser.residenceType || 'Hostel Resident',
      hostelBlock: newReq.hostelBlock || currentUser.hostelBlock || 'Block B - Room 304',
      bloodGroup: newReq.bloodGroup || currentUser.bloodGroup || 'O+',
      guardianNotified: newReq.guardianNotified,
      guardianNotifiedAt: newReq.guardianNotifiedAt,
      attachmentLabel: newReq.attachmentLabel,
      status: 'pending',
      gateState: 'no_exit',
      createdAt: stamp.timeLabel,
      createdAtISO: stamp.isoString,
    }

    setRequests((prev) => [created, ...prev])
    appendAudit('gate_pass', stamp.id, 'create_request', {
      passNumber: stamp.passNumber,
      receiptNumber: stamp.receiptNumber,
      studentId: created.collegeStudentId || 'STU-2026-1042',
      priority: created.priority || 'normal',
      category: created.category || 'academic',
      reason: created.reason,
    })

    showToast(
      `Pass ${stamp.passNumber} (Receipt ${stamp.receiptNumber}) submitted.`,
      'staff',
    )
  }

  const handleCancelRequest = (requestId: string) => {
    const req = requests.find((r) => r.id === requestId)
    if (!req) return
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'cancelled' as const } : r)),
    )
    appendAudit('gate_pass', requestId, 'cancel_request', {
      passNumber: req.passNumber,
      studentRollNo: req.studentRollNo,
    })
    showToast(`Request ${req.passNumber} cancelled by student.`)
  }

  const handleStaffDecision = (
    requestId: string,
    decision: 'approved' | 'rejected',
    note: string,
  ) => {
    const stamp = generateActionStamp('dec')
    const reqItem = requests.find((r) => r.id === requestId)

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const qrCode =
            decision === 'approved'
              ? `SG-${r.passNumber.slice(-3)}-${stamp.qrCodeSuffix}`
              : undefined

          return {
            ...r,
            status: decision,
            decisionNote: note,
            decidedBy: currentUser.id,
            decidedByName: currentUser.name,
            decidedAt: stamp.timeLabel,
            decidedAtISO: stamp.isoString,
            qrToken: qrCode,
            qrExpiresAt: `${stamp.timeLabel.split(',')[0]}, ${policies.campusCurfewTime}`,
          }
        }
        return r
      }),
    )

    if (reqItem) {
      appendAudit(
        'gate_pass',
        requestId,
        decision === 'approved' ? 'approve_request' : 'reject_request',
        {
          passNumber: reqItem.passNumber,
          receiptNumber: reqItem.receiptNumber || 'RCPT-2026-8801',
          decision,
          note,
        },
      )
    }

    showToast(
      `Pass ${decision === 'approved' ? 'Approved & Official QR Receipt Issued' : 'Declined'}.`,
      decision === 'approved' ? 'guard' : 'student',
    )
  }

  const handleBatchApprove = (requestIds: string[], note: string) => {
    const stamp = generateActionStamp('bat')
    setRequests((prev) =>
      prev.map((r) => {
        if (requestIds.includes(r.id) && r.status === 'pending') {
          const qrCode = `SG-${r.passNumber.slice(-3)}-${stamp.qrCodeSuffix}`
          return {
            ...r,
            status: 'approved' as const,
            decisionNote: note,
            decidedBy: currentUser.id,
            decidedByName: currentUser.name,
            decidedAt: stamp.timeLabel,
            decidedAtISO: stamp.isoString,
            qrToken: qrCode,
            qrExpiresAt: `${stamp.timeLabel.split(',')[0]}, ${policies.campusCurfewTime}`,
          }
        }
        return r
      }),
    )

    appendAudit('gate_pass', requestIds.join(','), 'approve_request', {
      batchCount: requestIds.length,
      note,
    })
    showToast(`Batch approved ${requestIds.length} gate pass receipts.`, 'guard')
  }

  const handleRecordExit = (
    requestId: string,
    physicalConfirmed: boolean,
    gateLocation: GateLocation,
    remarks: string,
    scanMethod: GateEvent['scanMethod'] = 'manual_token',
  ) => {
    const req = requests.find((r) => r.id === requestId)
    if (!req) return

    const stamp = generateActionStamp('evt')

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              gateState: 'exited' as const,
              actualExitTime: stamp.timeLabel,
              actualExitTimeISO: stamp.isoString,
              exitGate: gateLocation,
              guardRemarks: remarks || undefined,
            }
          : r,
      ),
    )

    const newGateEvent: GateEvent = {
      id: stamp.id,
      requestId,
      passNumber: req.passNumber,
      receiptNumber: req.receiptNumber,
      studentName: req.studentName,
      studentRollNo: req.studentRollNo,
      collegeStudentId: req.collegeStudentId,
      department: req.department,
      eventType: 'exit',
      timestamp: stamp.timeLabel,
      timestampISO: stamp.isoString,
      hourOfDay: stamp.hourOfDay,
      guardId: currentUser.id,
      guardName: currentUser.name,
      gateLocation,
      physicalIdConfirmed: physicalConfirmed,
      scanMethod,
      note: remarks || 'Physical College ID match confirmed. Student exited campus.',
    }
    setGateEvents((prev) => [newGateEvent, ...prev])

    appendAudit('gate_event', newGateEvent.id, 'record_exit', {
      passNumber: req.passNumber,
      receiptNumber: req.receiptNumber || 'RCPT-2026-8801',
      studentRollNo: req.studentRollNo,
      gate: gateLocation,
      scanMethod: scanMethod || 'manual_token',
      physicalIdConfirmed: physicalConfirmed,
    })
    showToast(
      `EXIT DB ENTRY SAVED: ${req.studentName} (${req.passNumber}) at ${gateLocation}.`,
    )
  }

  const handleRecordReturn = (
    requestId: string,
    physicalConfirmed: boolean,
    gateLocation: GateLocation,
    remarks: string,
    scanMethod: GateEvent['scanMethod'] = 'manual_token',
  ) => {
    const req = requests.find((r) => r.id === requestId)
    if (!req) return

    const stamp = generateActionStamp('evt')

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'completed' as const,
              gateState: 'returned' as const,
              isOverdue: false,
              actualReturnTime: stamp.timeLabel,
              actualReturnTimeISO: stamp.isoString,
              returnGate: gateLocation,
              guardRemarks: remarks || r.guardRemarks,
            }
          : r,
      ),
    )

    const newGateEvent: GateEvent = {
      id: stamp.id,
      requestId,
      passNumber: req.passNumber,
      receiptNumber: req.receiptNumber,
      studentName: req.studentName,
      studentRollNo: req.studentRollNo,
      collegeStudentId: req.collegeStudentId,
      department: req.department,
      eventType: 'return',
      timestamp: stamp.timeLabel,
      timestampISO: stamp.isoString,
      hourOfDay: stamp.hourOfDay,
      guardId: currentUser.id,
      guardName: currentUser.name,
      gateLocation,
      physicalIdConfirmed: physicalConfirmed,
      scanMethod,
      isLateReturn: Boolean(req.isOverdue),
      lateMinutes: req.overdueMinutes,
      note:
        remarks ||
        (req.isOverdue
          ? `Late return logged (+${req.overdueMinutes || 45}m past curfew). Physical ID verified.`
          : 'Safe return to campus confirmed via QR & physical ID check.'),
    }
    setGateEvents((prev) => [newGateEvent, ...prev])

    appendAudit('gate_event', newGateEvent.id, 'record_return', {
      passNumber: req.passNumber,
      receiptNumber: req.receiptNumber || 'RCPT-2026-8801',
      studentRollNo: req.studentRollNo,
      gate: gateLocation,
      scanMethod: scanMethod || 'manual_token',
      lateReturn: Boolean(req.isOverdue),
    })
    showToast(
      `RETURN DB ENTRY SAVED: ${req.studentName} (${req.passNumber}). Pass cycle completed.`,
    )
  }

  const handleFlagOverdue = (requestId: string) => {
    const req = requests.find((r) => r.id === requestId)
    if (!req) return
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, isOverdue: true, overdueMinutes: 35 } : r,
      ),
    )
    appendAudit('gate_pass', requestId, 'flag_overdue', {
      passNumber: req.passNumber,
      studentRollNo: req.studentRollNo,
    })
    showToast(`Pass ${req.passNumber} flagged as Overdue Curfew Breach.`, 'admin')
  }

  const handleNotifyGuardian = (requestId: string) => {
    const req = requests.find((r) => r.id === requestId)
    if (!req) return
    const stamp = generateActionStamp('sms')
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, guardianNotified: true, guardianNotifiedAt: stamp.timeLabel }
          : r,
      ),
    )
    appendAudit('gate_pass', requestId, 'notify_guardian', {
      passNumber: req.passNumber,
      guardianPhone: req.guardianPhone || '+91 98201 99881',
    })
    showToast(`Guardian SMS notification dispatched for ${req.studentName}.`)
  }

  const handleRevokePass = (requestId: string) => {
    const req = requests.find((r) => r.id === requestId)
    if (!req) return
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'cancelled' as const,
              decisionNote: `Revoked by Admin (${currentUser.name}).`,
            }
          : r,
      ),
    )
    appendAudit('gate_pass', requestId, 'revoke_pass', {
      passNumber: req.passNumber,
      studentRollNo: req.studentRollNo,
    })
    showToast(`Pass ${req.passNumber} revoked by Administrator.`)
  }

  const handleUpdatePolicies = (updated: CampusPolicyConfig) => {
    setPolicies(updated)
    appendAudit('policy', 'campus_policies', 'update_policy', {
      curfew: updated.campusCurfewTime,
      crossDept: updated.allowCrossDepartmentApproval,
      failClosed: updated.strictFailClosedMode,
    })
    showToast('Campus security policies updated & logged to audit trail.')
  }

  const handleResetDemoData = () => {
    setUsers(MOCK_PROFILES)
    setRequests(INITIAL_MOCK_REQUESTS)
    setGateEvents(INITIAL_MOCK_GATE_EVENTS)
    setAuditLogs(INITIAL_MOCK_AUDIT_LOGS)
    setPolicies(DEFAULT_POLICIES)
    setSelectedUserId('usr_student_01')
    setCurrentRole('student')
    showToast('All database records, users & receipts reset to campus baseline.')
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const urgentSosCount = requests.filter(
    (r) => r.status === 'pending' && r.priority === 'emergency',
  ).length
  const overdueCount = requests.filter((r) => r.isOverdue && r.gateState === 'exited').length
  const readyQrCount = requests.filter(
    (r) => r.status === 'approved' && (r.gateState === 'no_exit' || r.gateState === 'exited'),
  ).length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white transition-colors">
      {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (4 Module Portals) — Zone 3 (Login / Register + Theme + Reset) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark + Live Accurate Clock */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault()
                handleRoleSwitch('student')
              }}
              className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
            >
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                SG
              </span>
              <span>SmartGate</span>
            </a>
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 tabular-nums">
              <Clock size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{liveClock}</span>
            </div>
          </div>

          {/* Zone 2: 4 Dedicated Role Module Portals */}
          <nav className="flex items-center gap-2 sm:gap-5 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => handleRoleSwitch('student')}
              className={`py-1.5 px-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                currentRole === 'student'
                  ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-white font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Student Module</span>
            </button>

            <button
              onClick={() => handleRoleSwitch('staff')}
              className={`py-1.5 px-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                currentRole === 'staff'
                  ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-white font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Staff Module</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleRoleSwitch('guard')}
              className={`py-1.5 px-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                currentRole === 'guard'
                  ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-white font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <QrCode size={13} />
              <span>Guard Scanner</span>
              {readyQrCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono">
                  {readyQrCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleRoleSwitch('admin')}
              className={`py-1.5 px-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                currentRole === 'admin'
                  ? 'border-amber-600 dark:border-amber-500 text-amber-600 dark:text-white font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Admin Module</span>
            </button>
          </nav>

          {/* Zone 3: Dedicated Role Login / Registration Gateway + Theme Toggle + Reset */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <UserPlus size={13} />
              <span>Role Login / Register</span>
            </button>

            <button
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Daylight Light' : 'Command Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <a
              href="/SmartGate-Updated.zip"
              download="SmartGate-Updated.zip"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/70 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Download full updated source code (.zip) to push to GitHub"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download Code (.zip)</span>
            </a>

            <button
              onClick={handleResetDemoData}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Reset persistent localStorage state to default demo records"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Context & Active Account Switcher Bar */}
      <div className="bg-slate-100/80 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Active Persona Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Users size={14} className="text-blue-600 dark:text-blue-400" />
              <span className="font-semibold">
                {currentRole.toUpperCase()} Accounts ({roleProfiles.length}):
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {roleProfiles.map((prof) => (
                <button
                  key={prof.id}
                  onClick={() => setSelectedUserId(prof.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    currentUser.id === prof.id
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span>{prof.name}</span>
                  <span className="font-mono text-[11px] opacity-85">
                    ({prof.studentId || prof.rollNo || prof.staffId})
                  </span>
                </button>
              ))}
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition cursor-pointer whitespace-nowrap"
              >
                + Register New {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
              </button>
            </div>
          </div>

          {/* Live System Alert Strip */}
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
            {urgentSosCount > 0 && (
              <button
                onClick={() => handleRoleSwitch('staff')}
                className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer whitespace-nowrap"
              >
                <Flame size={13} />
                <span>{urgentSosCount} Urgent SOS Pending</span>
              </button>
            )}
            {overdueCount > 0 && (
              <button
                onClick={() => handleRoleSwitch('admin')}
                className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer whitespace-nowrap"
              >
                <AlertTriangle size={13} />
                <span>{overdueCount} Overdue Off-Campus</span>
              </button>
            )}
            <span className="hidden md:inline text-slate-500">
              Curfew: {policies.campusCurfewTime}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-500/40 text-slate-900 dark:text-slate-100 text-xs shadow-2xl">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage.text}</span>
            {toastMessage.targetRole && toastMessage.targetRole !== currentRole && (
              <button
                onClick={() => {
                  handleRoleSwitch(toastMessage.targetRole!)
                  setToastMessage(null)
                }}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition cursor-pointer whitespace-nowrap"
              >
                Open {toastMessage.targetRole.toUpperCase()} &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentRole === 'student' && (
          <StudentDashboard
            user={currentUser}
            requests={requests}
            policies={policies}
            onRequestCreate={handleRequestCreate}
            onCancelRequest={handleCancelRequest}
            onNotifyGuardian={handleNotifyGuardian}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onJumpToGuardScan={handleJumpToGuardScan}
          />
        )}

        {currentRole === 'staff' && (
          <StaffDashboard
            user={currentUser}
            requests={requests}
            policies={policies}
            onDecision={handleStaffDecision}
            onBatchApprove={handleBatchApprove}
            onFlagOverdue={handleFlagOverdue}
            onNotifyGuardian={handleNotifyGuardian}
          />
        )}

        {currentRole === 'guard' && (
          <GuardDashboard
            key={initialScanToken || 'guard-terminal'}
            user={currentUser}
            requests={requests}
            gateEvents={gateEvents}
            policies={policies}
            initialScanToken={initialScanToken}
            onClearInitialScanToken={() => setInitialScanToken(null)}
            onRecordExit={handleRecordExit}
            onRecordReturn={handleRecordReturn}
          />
        )}

        {currentRole === 'admin' && (
          <AdminDashboard
            user={currentUser}
            users={users}
            requests={requests}
            gateEvents={gateEvents}
            auditLogs={auditLogs}
            policies={policies}
            onUpdatePolicies={handleUpdatePolicies}
            onRevokePass={handleRevokePass}
            onNotifyGuardian={handleNotifyGuardian}
            onOpenRegisterModal={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Role Login & Registration Gateway Modal */}
      {isAuthModalOpen && (
        <RoleAuthModal
          users={users}
          currentUser={currentUser}
          initialRole={currentRole}
          onSelectUser={handleSelectUserFromAuth}
          onRegisterUser={handleRegisterUser}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
            <span>
              SmartGate — Multi-Role Campus Gate-Pass Receipt & QR Scanner System
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <FileSpreadsheet size={12} /> Official Pass Receipts
            </span>
            <span aria-hidden="true">·</span>
            <span>Anti-Duplicate Registration Guard</span>
            <span aria-hidden="true">·</span>
            <span>Mobile + Guard Software QR Scanner</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
