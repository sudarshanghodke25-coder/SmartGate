import React, { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  Clock,
  CheckCheck,
  MapPin,
  Search,
  Flame,
  AlertTriangle,
  Phone,
  Paperclip,
  Send,
  IdCard,
  Printer,
} from 'lucide-react'
import type { UserProfile, GatePassRequest, CampusPolicyConfig } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import { DecisionModal } from './DecisionModal'
import { PassQrModal } from '../student/PassQrModal'

interface StaffDashboardProps {
  user: UserProfile
  requests: GatePassRequest[]
  policies: CampusPolicyConfig
  onDecision: (requestId: string, decision: 'approved' | 'rejected', note: string) => void
  onBatchApprove: (requestIds: string[], note: string) => void
  onFlagOverdue: (requestId: string) => void
  onNotifyGuardian: (requestId: string) => void
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  user,
  requests,
  policies,
  onDecision,
  onBatchApprove,
  onFlagOverdue,
  onNotifyGuardian,
}) => {
  const [filter, setFilter] = useState<
    'pending' | 'sos' | 'off_campus' | 'overdue' | 'approved' | 'rejected' | 'all'
  >('pending')
  const [search, setSearch] = useState('')
  const [showAllDepts, setShowAllDepts] = useState(policies.allowCrossDepartmentApproval)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [decisionModalState, setDecisionModalState] = useState<{
    request: GatePassRequest
    type: 'approve' | 'reject'
  } | null>(null)
  const [receiptModalPass, setReceiptModalPass] = useState<GatePassRequest | null>(null)

  const canViewAllDepts = policies.allowCrossDepartmentApproval && showAllDepts
  const deptRequests = requests.filter(
    (r) => canViewAllDepts || !user.department || r.department === user.department,
  )

  const pendingRequests = deptRequests.filter((r) => r.status === 'pending')
  const urgentSosPending = pendingRequests.filter((r) => r.priority === 'emergency')
  const offCampusRequests = deptRequests.filter((r) => r.gateState === 'exited')
  const overdueRequests = deptRequests.filter((r) => r.isOverdue && r.gateState === 'exited')
  const approvedCount = deptRequests.filter(
    (r) => r.status === 'approved' || r.status === 'completed',
  ).length

  const sortedRequests = [...deptRequests].sort((a, b) => {
    if (a.status === 'pending' && b.status === 'pending') {
      if (a.priority === 'emergency' && b.priority !== 'emergency') return -1
      if (b.priority === 'emergency' && a.priority !== 'emergency') return 1
    }
    return 0
  })

  const filteredRequests = sortedRequests.filter((r) => {
    if (filter === 'pending' && r.status !== 'pending') return false
    if (filter === 'sos' && r.priority !== 'emergency') return false
    if (filter === 'off_campus' && r.gateState !== 'exited') return false
    if (filter === 'overdue' && !(r.isOverdue && r.gateState === 'exited')) return false
    if (filter === 'approved' && r.status !== 'approved' && r.status !== 'completed') return false
    if (filter === 'rejected' && r.status !== 'rejected') return false

    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.studentRollNo.toLowerCase().includes(q) ||
        (r.collegeStudentId || '').toLowerCase().includes(q) ||
        (r.receiptNumber || '').toLowerCase().includes(q) ||
        r.passNumber.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      )
    }
    return true
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleBatchApproveClick = () => {
    if (selectedIds.length === 0) return
    onBatchApprove(selectedIds, `Batch verified & approved by ${user.name}.`)
    setSelectedIds([])
  }

  const getStudentTrackRecord = (rollNo: string) => {
    const allForStudent = requests.filter((r) => r.studentRollNo === rollNo)
    const completed = allForStudent.filter((r) => r.status === 'completed').length
    const late = allForStudent.filter((r) => r.isOverdue).length
    return { total: allForStudent.length, completed, late }
  }

  return (
    <div className="space-y-6">
      {/* Urgent Emergency SOS Banner */}
      {urgentSosPending.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Flame size={20} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {urgentSosPending.length} Urgent Emergency SOS Pass Request
                {urgentSosPending.length > 1 ? 's' : ''} Awaiting Immediate Triage
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-200/90 mt-0.5">
                {urgentSosPending[0].studentName} ({urgentSosPending[0].studentRollNo} ·{' '}
                {urgentSosPending[0].collegeStudentId || 'STU-2026-1019'}) — "
                {urgentSosPending[0].reason}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() =>
                setDecisionModalState({ request: urgentSosPending[0], type: 'approve' })
              }
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-sm"
            >
              Approve SOS & Issue QR
            </button>
          </div>
        </div>
      )}

      {/* Staff Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              Faculty Approval Module
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {user.name} ({user.staffId || 'FAC-CE-108'})
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {user.designation || 'HOD'} ·{' '}
              {canViewAllDepts ? 'All Campus Departments' : `${user.department} Scope`}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Student Gate Pass Review & Receipt Authorization Desk
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs">
            Verify student registration details, parent/guardian phone numbers, and issue scannable QR Gate Pass Receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {policies.allowCrossDepartmentApproval && (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={showAllDepts}
                onChange={(e) => setShowAllDepts(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span className="whitespace-nowrap">All Departments (P1)</span>
            </label>
          )}

          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchApproveClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-sm"
            >
              <CheckCheck size={15} />
              <span>Batch Approve ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Pending Queue
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1">
            {pendingRequests.length}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">
            {urgentSosPending.length > 0
              ? `Includes ${urgentSosPending.length} Urgent SOS`
              : 'Awaiting faculty stamp'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Currently Off-Campus
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums mt-1">
            {offCampusRequests.length}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">Exited gate, awaiting return</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Overdue Curfew Breaches
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1">
            {overdueRequests.length}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">Past expected return time</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Approved Receipts
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
            {approvedCount}
          </div>
          <p className="text-slate-400 text-[11px] mt-1">QR tokens issued</p>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {(
            [
              { id: 'pending', label: `Pending (${pendingRequests.length})` },
              { id: 'sos', label: `Urgent SOS (${urgentSosPending.length})` },
              { id: 'off_campus', label: `Off-Campus (${offCampusRequests.length})` },
              { id: 'overdue', label: `Overdue (${overdueRequests.length})` },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Declined' },
              { id: 'all', label: `All (${deptRequests.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                filter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by student, ID, or receipt..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Request Cards */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <CheckCheck size={32} className="mx-auto text-emerald-500" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              No requests in this queue
            </h4>
            <p className="text-xs text-slate-500">
              All matching student gate pass requests have been processed.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const trackRecord = getStudentTrackRecord(req.studentRollNo)
            const isSelected = selectedIds.includes(req.id)

            return (
              <div
                key={req.id}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm transition ${
                  req.priority === 'emergency' && req.status === 'pending'
                    ? 'border-rose-500/50'
                    : req.isOverdue && req.gateState === 'exited'
                      ? 'border-amber-500/50'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 max-w-2xl">
                    {req.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(req.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                        title="Select for batch approval"
                      />
                    )}

                    <div className="space-y-2">
                      {/* Receipt & Pass Metadata */}
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
                          Applied: {req.createdAt}
                        </span>
                      </div>

                      {/* Validated Student Identity */}
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {req.studentName}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-mono text-xs font-bold tabular-nums">
                          (Roll: {req.studentRollNo} · ID: {req.collegeStudentId || 'STU-2026-1042'})
                        </span>
                        <span aria-hidden="true" className="text-slate-400">
                          ·
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {req.department} ({req.year})
                        </span>
                        <span aria-hidden="true" className="text-slate-400">
                          ·
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                          History: {trackRecord.completed} completed, {trackRecord.late} late
                        </span>
                      </div>

                      {/* Reason */}
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                        {req.reason}
                      </p>

                      {/* Location, Timings & Contacts */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          {req.destination}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 font-mono tabular-nums">
                          <Clock size={12} className="text-amber-500 shrink-0" />
                          Leave: {req.leaveTime} &rarr; Return: {req.expectedReturnTime}
                        </span>
                        {req.guardianPhone && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                              <Phone size={11} className="text-blue-500" />
                              Guardian ({req.guardianName || 'Parent'}): {req.guardianPhone}
                            </span>
                          </>
                        )}
                        {req.hostelBlock && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1">
                              <IdCard size={11} />
                              {req.hostelBlock}
                            </span>
                          </>
                        )}
                        {req.attachmentLabel && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <Paperclip size={11} />
                              {req.attachmentLabel}
                            </span>
                          </>
                        )}
                      </div>

                      {req.decisionNote && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Faculty Stamp ({req.decidedByName || 'Staff'}):{' '}
                          </span>
                          {req.decisionNote}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => setDecisionModalState({ request: req, type: 'reject' })}
                          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-xs font-bold transition cursor-pointer whitespace-nowrap"
                        >
                          <XCircle size={14} />
                          <span>Decline</span>
                        </button>

                        <button
                          onClick={() => setDecisionModalState({ request: req, type: 'approve' })}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition cursor-pointer whitespace-nowrap"
                        >
                          <CheckCircle size={14} />
                          <span>Approve & Issue Receipt QR</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setReceiptModalPass(req)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer whitespace-nowrap"
                      >
                        <Printer size={13} />
                        <span>Inspect Receipt</span>
                      </button>
                    )}

                    {req.gateState === 'exited' && !req.isOverdue && (
                      <button
                        onClick={() => onFlagOverdue(req.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-xs font-bold transition cursor-pointer whitespace-nowrap"
                      >
                        <AlertTriangle size={13} />
                        <span>Mark Overdue</span>
                      </button>
                    )}

                    {req.gateState === 'exited' && req.isOverdue && (
                      <button
                        onClick={() => onNotifyGuardian(req.id)}
                        disabled={Boolean(req.guardianNotified)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                          req.guardianNotified
                            ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 cursor-default'
                            : 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                        }`}
                      >
                        <Send size={13} />
                        <span>
                          {req.guardianNotified ? 'Guardian Alerted' : 'Alert Guardian (Late)'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Decision Modal */}
      {decisionModalState && (
        <DecisionModal
          request={decisionModalState.request}
          decisionType={decisionModalState.type}
          onClose={() => setDecisionModalState(null)}
          onConfirm={onDecision}
        />
      )}

      {/* Inspect Receipt Modal */}
      {receiptModalPass && (
        <PassQrModal
          request={receiptModalPass}
          onClose={() => setReceiptModalPass(null)}
          onNotifyGuardian={onNotifyGuardian}
        />
      )}
    </div>
  )
}
