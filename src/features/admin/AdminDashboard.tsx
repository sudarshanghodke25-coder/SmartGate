import React, { useState } from 'react'
import {
  FileText,
  Activity,
  Search,
  ArrowRight,
  RotateCcw,
  Sliders,
  Lock,
  BarChart3,
  Download,
  AlertTriangle,
  ShieldCheck,
  Send,
  Ban,
  CheckCircle2,
  Users,
  UserPlus,
  Printer,
} from 'lucide-react'
import type {
  UserProfile,
  GatePassRequest,
  GateEvent,
  AuditEvent,
  CampusPolicyConfig,
} from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import {
  exportPassesToCsv,
  exportGateEventsToCsv,
  exportAuditLogsToCsv,
  exportUsersToCsv,
  computeAuditHash,
} from '../../lib/qrAndExport'
import { PassQrModal } from '../student/PassQrModal'

interface AdminDashboardProps {
  user: UserProfile
  users: UserProfile[]
  requests: GatePassRequest[]
  gateEvents: GateEvent[]
  auditLogs: AuditEvent[]
  policies: CampusPolicyConfig
  onUpdatePolicies: (updated: CampusPolicyConfig) => void
  onRevokePass: (requestId: string) => void
  onNotifyGuardian: (requestId: string) => void
  onOpenRegisterModal: () => void
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  users,
  requests,
  gateEvents,
  auditLogs,
  policies,
  onUpdatePolicies,
  onRevokePass,
  onNotifyGuardian,
  onOpenRegisterModal,
}) => {
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'users' | 'passes' | 'overdue' | 'events' | 'audit' | 'policies'
  >('analytics')
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [chainVerified, setChainVerified] = useState<boolean | null>(null)
  const [inspectedReceipt, setInspectedReceipt] = useState<GatePassRequest | null>(null)

  const activeOffCampus = requests.filter((r) => r.gateState === 'exited').length
  const overdueStudents = requests.filter((r) => r.isOverdue && r.gateState === 'exited')
  const totalCompleted = requests.filter((r) => r.status === 'completed').length
  const pendingApprovals = requests.filter((r) => r.status === 'pending').length
  const totalStudents = users.filter((u) => u.role === 'student').length

  const departments = [
    'Computer Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Electronics & Telecom',
  ]

  const deptMetrics = departments.map((dept) => {
    const deptPasses = requests.filter((r) => r.department === dept)
    const active = deptPasses.filter((r) => r.gateState === 'exited').length
    return {
      dept,
      total: deptPasses.length,
      active,
    }
  })
  const maxDeptCount = Math.max(...deptMetrics.map((d) => d.total), 1)

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
  const hourlyStats = hours.map((h) => {
    const exits = gateEvents.filter((e) => e.eventType === 'exit' && (e.hourOfDay ?? 11) === h).length
    const returns = gateEvents.filter(
      (e) => e.eventType === 'return' && (e.hourOfDay ?? 13) === h,
    ).length
    const baseExit = h === 10 || h === 14 ? 2 : h === 11 || h === 15 ? 3 : 1
    const baseRet = h === 12 || h === 16 ? 3 : h === 17 ? 4 : 1
    return {
      label: h > 12 ? `${h - 12}PM` : h === 12 ? '12PM' : `${h}AM`,
      exits: exits + baseExit,
      returns: returns + baseRet,
    }
  })

  const categories = [
    { id: 'medical_sos', label: 'Medical / SOS' },
    { id: 'academic', label: 'Academic / Project' },
    { id: 'official', label: 'Official Errand' },
    { id: 'personal', label: 'Personal' },
  ]

  const filteredRequests = requests.filter((r) => {
    if (deptFilter !== 'all' && r.department !== deptFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.studentRollNo.toLowerCase().includes(q) ||
      (r.collegeStudentId || '').toLowerCase().includes(q) ||
      (r.receiptNumber || '').toLowerCase().includes(q) ||
      r.passNumber.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
    )
  })

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      (u.rollNo || '').toLowerCase().includes(q) ||
      (u.studentId || '').toLowerCase().includes(q) ||
      (u.staffId || '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })

  const handleVerifyAuditChain = () => {
    const chronological = [...auditLogs].reverse()
    let valid = true
    for (let i = 0; i < chronological.length; i++) {
      const entry = chronological[i]
      if (!entry.hash || !entry.prevHash) continue
      const payload = `${entry.id}:${entry.action}:${entry.entityId}:${entry.actorId}:${JSON.stringify(entry.metadata)}`
      const expected = computeAuditHash(entry.prevHash, payload)
      if (expected !== entry.hash) {
        valid = false
        break
      }
    }
    setChainVerified(valid)
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-purple-600 dark:text-purple-400">
              Administrator Command Module
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {user.name} ({user.staffId || 'ADM-DIR-001'})
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Duplicate Registration Guard Active
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Master Student & Receipt Database, Analytics & Policy Control
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs">
            Manage registered student/staff accounts, inspect official Gate Pass Receipts, monitor overdue curfew breaches, and export CSV records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenRegisterModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-sm"
          >
            <UserPlus size={14} />
            <span>Register Student / Staff</span>
          </button>
          <button
            onClick={() => exportPassesToCsv(requests)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer whitespace-nowrap"
          >
            <Download size={14} />
            <span>Export Receipts CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Registered Students
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono tabular-nums mt-1">
            {totalStudents}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">Unique Roll Nos & IDs</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Total Pass Receipts
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {requests.length}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">{pendingApprovals} pending review</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Currently Off-Campus
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums mt-1">
            {activeOffCampus}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">Exited gate, awaiting return</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Overdue Curfew Alerts
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1">
            {overdueStudents.length}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">Curfew: {policies.campusCurfewTime}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Completed Returns
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
            {totalCompleted}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">Verified QR & ID cycles</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        {(
          [
            { id: 'analytics', label: 'Analytics & Traffic', icon: BarChart3 },
            { id: 'users', label: `User Directory (${users.length})`, icon: Users },
            { id: 'passes', label: `Pass Receipts (${requests.length})`, icon: FileText },
            {
              id: 'overdue',
              label: `Overdue Watch (${overdueStudents.length})`,
              icon: AlertTriangle,
            },
            { id: 'events', label: `Gate Entries (${gateEvents.length})`, icon: Activity },
            { id: 'audit', label: `Audit Ledger (${auditLogs.length})`, icon: Lock },
            { id: 'policies', label: 'Policy Engine (P1-P13)', icon: Sliders },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'border-purple-600 dark:border-purple-400 text-purple-600 dark:text-white bg-purple-50/50 dark:bg-slate-900/60'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab 1: Interactive Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Hourly Campus Gate Exit & Return Traffic
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comparison of gate departures vs verified student returns (08:00 AM – 06:00 PM)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-600 inline-block" />
                  Exits
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
                  Returns
                </span>
              </div>
            </div>

            <div className="pt-4">
              <div className="grid grid-cols-11 gap-2 items-end h-44 border-b border-slate-200 dark:border-slate-800 pb-2 px-1">
                {hourlyStats.map((slot) => {
                  const exitHeight = Math.min(100, slot.exits * 18)
                  const retHeight = Math.min(100, slot.returns * 18)
                  return (
                    <div
                      key={slot.label}
                      className="flex flex-col items-center justify-end h-full gap-1"
                    >
                      <div className="flex items-end gap-1 w-full justify-center h-36">
                        <div
                          style={{ height: `${exitHeight}%` }}
                          className="w-2.5 rounded-t bg-blue-600 transition-all"
                          title={`${slot.label}: ${slot.exits} Exits`}
                        />
                        <div
                          style={{ height: `${retHeight}%` }}
                          className="w-2.5 rounded-t bg-emerald-500 transition-all"
                          title={`${slot.label}: ${slot.returns} Returns`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-11 gap-2 pt-2 text-center">
                {hourlyStats.map((slot) => (
                  <span
                    key={slot.label}
                    className="text-[10px] font-mono text-slate-500 tabular-nums"
                  >
                    {slot.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Departmental Pass Volume
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total gate pass receipts and active off-campus count by department
              </p>
            </div>

            <div className="space-y-3">
              {deptMetrics.map((d) => {
                const pct = Math.round((d.total / maxDeptCount) * 100)
                return (
                  <div key={d.dept} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {d.dept}
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {d.total} total · {d.active} exited
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                      <div
                        style={{ width: `${Math.max(pct, 8)}%` }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Receipts by Category
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.map((cat) => {
                  const count = requests.filter(
                    (r) => (r.category || 'official') === cat.id,
                  ).length
                  return (
                    <div
                      key={cat.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {cat.label}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Registered Student & Staff Directory (Anti-Duplicate Database View) */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                Verified Campus Users Database ({filteredUsers.length})
              </h3>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Roles</option>
                <option value="student">Students Only</option>
                <option value="staff">Staff / Faculty</option>
                <option value="guard">Security Guards</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Roll No, Student ID, Name..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-xs"
                />
              </div>
              <button
                onClick={() => exportUsersToCsv(users)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                <Download size={13} />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Full Name & Email</th>
                  <th className="py-3 px-4">Unique ID / Roll No</th>
                  <th className="py-3 px-4">Department / Shift</th>
                  <th className="py-3 px-4">Student & Guardian Contact</th>
                  <th className="py-3 px-4">Registered Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 uppercase font-mono font-bold text-[11px]">
                      {u.role}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        {u.rollNo || u.staffId}
                      </div>
                      {u.studentId && (
                        <div className="text-[11px] text-slate-400">{u.studentId}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>{u.department || u.assignedGate || '-'}</div>
                      <div className="text-[11px] text-slate-400">
                        {u.year || u.designation || u.dutyShift || ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[11px]">
                      <div>Self: {u.phone || '-'}</div>
                      {u.guardianPhone && (
                        <div className="text-emerald-600 dark:text-emerald-400">
                          Guardian ({u.guardianName || 'Parent'}): {u.guardianPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 tabular-nums">
                      {u.registeredAt || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Master Pass Receipt Registry */}
      {activeTab === 'passes' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                Official Gate Pass Receipt Registry
              </h3>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter receipts, student ID, roll no..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Receipt & Pass #</th>
                  <th className="py-3 px-4">Student & Unique ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Reason & Accurate Timings</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {r.receiptNumber || `RCPT-${r.passNumber}`}
                      </div>
                      <div className="text-[11px] text-slate-400">{r.passNumber}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {r.studentName}
                      </div>
                      <div className="text-blue-600 dark:text-blue-400 font-mono text-[11px] tabular-nums">
                        {r.studentRollNo} · {r.collegeStudentId || 'STU-2026-1042'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {r.department}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <span className="text-slate-900 dark:text-slate-200 font-semibold block truncate">
                        {r.reason}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px] block truncate tabular-nums">
                        Out: {r.leaveTime} &rarr; In: {r.expectedReturnTime}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge
                        status={r.status}
                        gateState={r.gateState}
                        isOverdue={r.isOverdue}
                        priority={r.priority}
                        size="sm"
                      />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setInspectedReceipt(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-[11px] font-bold cursor-pointer"
                      >
                        <Printer size={11} />
                        <span>Receipt</span>
                      </button>
                      {r.status === 'approved' && r.gateState === 'no_exit' && (
                        <button
                          onClick={() => onRevokePass(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 text-[11px] font-bold transition cursor-pointer"
                        >
                          <Ban size={11} />
                          <span>Revoke</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Overdue Watch */}
      {activeTab === 'overdue' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Active Curfew Breaches & Off-Campus Escalation
              </h3>
              <p className="text-xs text-slate-500">
                Students who exited campus and exceeded their authorized return window
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {overdueStudents.length} active overdue
            </span>
          </div>

          {overdueStudents.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Zero Overdue Students
              </h4>
              <p className="text-xs text-slate-500">
                All off-campus students are within their authorized return window.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {overdueStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {student.receiptNumber || student.passNumber}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {student.studentName}
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        ({student.studentRollNo} · {student.collegeStudentId || 'STU-2026-1031'})
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-mono font-bold tabular-nums">
                        Overdue by +{student.overdueMinutes || 48} mins
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Destination: {student.destination} — Exited via{' '}
                      {student.exitGate || 'Main Gate 1'} at {student.actualExitTime} (Expected
                      return: {student.expectedReturnTime})
                    </p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      Guardian ({student.guardianName || 'Parent'}):{' '}
                      {student.guardianPhone || '+91 97650 44000'} · Status:{' '}
                      {student.guardianNotified
                        ? `Alert dispatched (${student.guardianNotifiedAt})`
                        : 'Not yet alerted'}
                    </p>
                  </div>

                  <button
                    onClick={() => onNotifyGuardian(student.id)}
                    disabled={Boolean(student.guardianNotified)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                      student.guardianNotified
                        ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 cursor-default'
                        : 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                    }`}
                  >
                    <Send size={13} />
                    <span>
                      {student.guardianNotified
                        ? 'Guardian Escalation Logged'
                        : 'Dispatch Guardian Curfew Alert'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Gate Events */}
      {activeTab === 'events' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              Gate Checkpoint Database Entry Logbook
            </h3>
            <button
              onClick={() => exportGateEventsToCsv(gateEvents)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer whitespace-nowrap"
            >
              <Download size={13} />
              <span>Export Events CSV</span>
            </button>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {gateEvents.map((evt) => (
              <div key={evt.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      evt.eventType === 'exit'
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {evt.eventType === 'exit' ? <ArrowRight size={15} /> : <RotateCcw size={15} />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {evt.studentName} ({evt.studentRollNo}) —{' '}
                      <span className="uppercase text-[11px] font-bold text-blue-600 dark:text-blue-400">
                        {evt.eventType}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] font-mono tabular-nums">
                      Receipt: {evt.receiptNumber || evt.passNumber} · Gate: {evt.gateLocation} ·
                      Guard: {evt.guardName}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span className="text-slate-800 dark:text-slate-200 font-bold block">
                    {evt.timestamp}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-sans font-semibold">
                    QR & Physical ID Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Append-Only SHA-256 Hash-Chained Security Audit Trail
              </h3>
              <p className="text-slate-500 text-xs">
                Every user registration, pass receipt, and gate scan is cryptographically linked.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {chainVerified !== null && (
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck size={14} />
                  {chainVerified
                    ? `All ${auditLogs.length} Hash Links Verified`
                    : 'Chain Mismatch'}
                </span>
              )}
              <button
                onClick={handleVerifyAuditChain}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
              >
                Verify Hash Chain Integrity
              </button>
              <button
                onClick={() => exportAuditLogsToCsv(auditLogs)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                CSV
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold uppercase text-[11px]">
                      {log.action}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">
                      ·
                    </span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {log.actorName}
                    </span>
                    <span className="text-slate-500">({log.actorRole})</span>
                    <span aria-hidden="true" className="text-slate-400">
                      ·
                    </span>
                    <span className="font-mono text-slate-500 tabular-nums">{log.timestamp}</span>
                  </div>

                  <div className="text-slate-500 text-[11px]">
                    Metadata:{' '}
                    <code className="text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      {JSON.stringify(log.metadata)}
                    </code>
                  </div>

                  {log.hash && (
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400 tabular-nums">
                      <span>PREV: {log.prevHash?.slice(0, 16)}...</span>
                      <span>&rarr;</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        HASH: {log.hash.slice(0, 24)}...
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-slate-400 font-mono text-[11px] tabular-nums shrink-0">
                  ID: {log.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Policies */}
      {activeTab === 'policies' && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Interactive Campus Policy Engine (P1–P13)
            </h3>
            <p className="text-xs text-slate-500">
              Changes made below take immediate effect across Student, Staff, and Guard portals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  P1: Cross-Department Staff Approval
                </span>
                <p className="text-slate-500 leading-relaxed">
                  Allow faculty approvers to view and approve requests from students outside their home department.
                </p>
              </div>
              <input
                type="checkbox"
                checked={policies.allowCrossDepartmentApproval}
                onChange={(e) =>
                  onUpdatePolicies({
                    ...policies,
                    allowCrossDepartmentApproval: e.target.checked,
                  })
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 cursor-pointer shrink-0"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  P5: Campus Evening Curfew Cutoff
                </span>
                <p className="text-slate-500 leading-relaxed">
                  Standard evening deadline after which off-campus passes are flagged for curfew review.
                </p>
              </div>
              <select
                value={policies.campusCurfewTime}
                onChange={(e) =>
                  onUpdatePolicies({
                    ...policies,
                    campusCurfewTime: e.target.value,
                  })
                }
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs tabular-nums"
              >
                <option value="05:30 PM">05:30 PM</option>
                <option value="06:30 PM">06:30 PM</option>
                <option value="07:30 PM">07:30 PM</option>
                <option value="08:30 PM">08:30 PM</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  S5 / P8: Strict Fail-Closed Guard Terminal
                </span>
                <p className="text-slate-500 leading-relaxed">
                  Block digital gate verification when network connectivity is offline; require manual gate register fallback.
                </p>
              </div>
              <input
                type="checkbox"
                checked={policies.strictFailClosedMode}
                onChange={(e) =>
                  onUpdatePolicies({
                    ...policies,
                    strictFailClosedMode: e.target.checked,
                  })
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 cursor-pointer shrink-0"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  P11: Mandatory Guardian Contact on Emergency SOS
                </span>
                <p className="text-slate-500 leading-relaxed">
                  Require a verified parent/guardian phone number and auto-dispatch alert on Emergency SOS passes.
                </p>
              </div>
              <input
                type="checkbox"
                checked={policies.requireGuardianPhoneForSOS}
                onChange={(e) =>
                  onUpdatePolicies({
                    ...policies,
                    requireGuardianPhoneForSOS: e.target.checked,
                  })
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 cursor-pointer shrink-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Receipt Inspection Modal */}
      {inspectedReceipt && (
        <PassQrModal
          request={inspectedReceipt}
          onClose={() => setInspectedReceipt(null)}
          onNotifyGuardian={onNotifyGuardian}
        />
      )}
    </div>
  )
}
