import React, { useState } from 'react'
import {
  Plus,
  QrCode,
  MapPin,
  FileText,
  Flame,
  Ban,
  Printer,
  AlertTriangle,
  Paperclip,
  Search,
  IdCard,
  Phone,
  Building2,
  UserPlus,
  CheckCircle2,
} from 'lucide-react'
import type { UserProfile, GatePassRequest, CampusPolicyConfig } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import { PassQrModal } from './PassQrModal'
import { NewRequestModal } from './NewRequestModal'

interface StudentDashboardProps {
  user: UserProfile
  requests: GatePassRequest[]
  policies: CampusPolicyConfig
  onRequestCreate: (newReq: Partial<GatePassRequest>) => void
  onCancelRequest: (requestId: string) => void
  onNotifyGuardian: (requestId: string) => void
  onOpenAuthModal: () => void
  onJumpToGuardScan: (token: string) => void
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  requests,
  policies,
  onRequestCreate,
  onCancelRequest,
  onNotifyGuardian,
  onOpenAuthModal,
  onJumpToGuardScan,
}) => {
  const [selectedPassForQr, setSelectedPassForQr] = useState<GatePassRequest | null>(null)
  const [newRequestMode, setNewRequestMode] = useState<'closed' | 'normal' | 'emergency'>('closed')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const studentRequests = requests.filter(
    (r) => r.studentId === user.id || r.studentRollNo === user.rollNo,
  )

  const activePass = studentRequests.find(
    (r) => r.status === 'approved' && r.gateState !== 'returned',
  )
  const pendingCount = studentRequests.filter((r) => r.status === 'pending').length
  const completedCount = studentRequests.filter((r) => r.status === 'completed').length
  const overduePass = studentRequests.find((r) => r.isOverdue && r.gateState === 'exited')

  const filteredRequests = studentRequests.filter((req) => {
    if (statusFilter === 'active' && req.status !== 'approved') return false
    if (statusFilter === 'pending' && req.status !== 'pending') return false
    if (statusFilter === 'completed' && req.status !== 'completed') return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        req.passNumber.toLowerCase().includes(q) ||
        (req.receiptNumber || '').toLowerCase().includes(q) ||
        req.reason.toLowerCase().includes(q) ||
        req.destination.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Overdue Curfew Alert Banner */}
      {overduePass && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Curfew Return Overdue — Pass {overduePass.passNumber} (Receipt:{' '}
                {overduePass.receiptNumber || 'RCPT-2026-8391'})
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-200/90 mt-0.5">
                Exited via {overduePass.exitGate || 'Main Gate 1'} at {overduePass.actualExitTime}{' '}
                and passed expected return ({overduePass.expectedReturnTime}) by{' '}
                <span className="font-mono font-bold tabular-nums">
                  {overduePass.overdueMinutes || 48} mins
                </span>
                . Scan your QR at the Guard Terminal immediately to record your return.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSelectedPassForQr(overduePass)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
            >
              Open Return QR Receipt
            </button>
          </div>
        </div>
      )}

      {/* Top Student Profile & Digital ID Card + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 8 cols: Student Welcome & Verified Credentials for Receipt */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Student Portal Module
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  Roll: {user.rollNo}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                  Student ID: {user.studentId || 'STU-2026-1042'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {user.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                {user.department} · {user.year || 'Year 3 (Diploma)'}{' '}
                {user.semester ? `· ${user.semester}` : ''} ·{' '}
                {user.hostelBlock || user.residenceType || 'Hostel Resident'}
              </p>
            </div>

            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer whitespace-nowrap self-start"
            >
              <UserPlus size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Switch / Register Student</span>
            </button>
          </div>

          {/* Validated Student Info Strip (Used for Official Gate Pass Receipts) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                <IdCard size={12} /> College Student ID
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {user.studentId || 'STU-2026-1042'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                <Phone size={12} /> Student Mobile
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                {user.phone || '+91 98201 12345'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                <Building2 size={12} /> Guardian Name
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user.guardianName || 'Rajesh Sharma'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                <Phone size={12} /> Guardian Phone
              </span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {user.guardianPhone || '+91 98201 99881'}
              </span>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Primary Pass Application Actions */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Quick Pass Application
            </span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
              Apply for Campus Exit Pass
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Generates an official Gate Pass Receipt with a real mobile-scannable & guard-scannable QR code.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => setNewRequestMode('normal')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Plus size={16} />
              <span>New Gate Pass Request</span>
            </button>

            <button
              onClick={() => setNewRequestMode('emergency')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-bold text-xs transition cursor-pointer"
            >
              <Flame size={15} className="text-rose-600 dark:text-rose-400" />
              <span>Urgent Medical / SOS Pass</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Approved Pass Spotlight */}
      {activePass && (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/40 dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                  {activePass.gateState === 'exited'
                    ? 'Active Pass — Currently Exited Off-Campus'
                    : 'Approved Pass — Ready for Gate QR Scan'}
                </span>
                <span aria-hidden="true" className="text-slate-400">
                  ·
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  Receipt: {activePass.receiptNumber || 'RCPT-2026-8410'}
                </span>
                <span aria-hidden="true" className="text-slate-400">
                  ·
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                  Pass: {activePass.passNumber}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {activePass.reason}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1.5 mt-1">
                  <MapPin size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Destination: {activePass.destination}</span>
                </p>
              </div>

              {/* 4-Step Visual Progress */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono tabular-nums">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-emerald-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">1. Requested</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    {activePass.createdAt}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-emerald-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">
                    2. Faculty Approved
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    {activePass.decidedAt || 'Approved'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-emerald-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">3. Gate Exit</span>
                  <span
                    className={`font-bold text-[11px] ${
                      activePass.gateState === 'exited'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {activePass.actualExitTime || `Leave: ${activePass.leaveTime}`}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-emerald-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">
                    4. Expected Return
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                    {activePass.expectedReturnTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-2.5 shrink-0">
              <button
                onClick={() => setSelectedPassForQr(activePass)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer whitespace-nowrap"
              >
                <QrCode size={16} />
                <span>Open QR & Official Receipt</span>
              </button>
              <button
                onClick={() =>
                  onJumpToGuardScan(activePass.qrToken || activePass.passNumber)
                }
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs transition cursor-pointer whitespace-nowrap"
              >
                <span>Scan in Guard Terminal &rarr;</span>
              </button>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono text-center tabular-nums">
                Token: <strong className="text-slate-900 dark:text-white">{activePass.qrToken}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Pending Faculty Review
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1">
            {pendingCount}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">Queued with department HOD/Staff</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Active QR Pass
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
            {activePass ? 1 : 0}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">Ready for mobile or guard scan</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Completed Returns
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tabular-nums mt-1">
            {completedCount}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">Verified exit & return receipts</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Campus Curfew Time
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {policies.campusCurfewTime}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">Daily return cutoff deadline</p>
        </div>
      </div>

      {/* Student Pass & Receipt History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              My Gate Passes & Official Receipts ({filteredRequests.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every request records accurate timestamps and generates a printable receipt.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {(['all', 'active', 'pending', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer whitespace-nowrap ${
                    statusFilter === tab
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search receipt or reason..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText size={32} className="mx-auto text-slate-400" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No gate pass records found for {user.name}.
              </p>
              <button
                onClick={() => setNewRequestMode('normal')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer"
              >
                Create First Gate Pass Request
              </button>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {req.receiptNumber || `RCPT-${req.passNumber}`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                      {req.passNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <StatusBadge
                      status={req.status}
                      gateState={req.gateState}
                      isOverdue={req.isOverdue}
                      priority={req.priority}
                      size="sm"
                    />
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-[11px]">
                      Created: {req.createdAt}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.reason}</h4>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      {req.destination}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Leave: {req.leaveTime} &rarr; Return: {req.expectedReturnTime}
                    </span>
                    {req.attachmentLabel && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Paperclip size={11} />
                          {req.attachmentLabel}
                        </span>
                      </>
                    )}
                  </div>

                  {req.decisionNote && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Faculty Stamp ({req.decidedByName || 'Staff'}): "{req.decisionNote}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {req.status === 'pending' && (
                    <button
                      onClick={() => onCancelRequest(req.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-800 text-xs font-bold transition cursor-pointer whitespace-nowrap"
                    >
                      <Ban size={13} />
                      <span>Cancel</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedPassForQr(req)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    {req.status === 'approved' ? (
                      <>
                        <QrCode size={14} />
                        <span>QR & Receipt</span>
                      </>
                    ) : (
                      <>
                        <Printer size={14} />
                        <span>View Receipt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedPassForQr && (
        <PassQrModal
          request={selectedPassForQr}
          onClose={() => setSelectedPassForQr(null)}
          onNotifyGuardian={onNotifyGuardian}
          onJumpToGuardScan={onJumpToGuardScan}
        />
      )}

      {newRequestMode !== 'closed' && (
        <NewRequestModal
          user={user}
          policies={policies}
          initialEmergency={newRequestMode === 'emergency'}
          onClose={() => setNewRequestMode('closed')}
          onSubmit={onRequestCreate}
        />
      )}
    </div>
  )
}
