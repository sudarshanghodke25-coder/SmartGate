import React, { useState } from 'react'
import { CheckCircle, XCircle, Clock, CheckCheck, MapPin, Search } from 'lucide-react'
import type { UserProfile, GatePassRequest } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import { DecisionModal } from './DecisionModal'

interface StaffDashboardProps {
  user: UserProfile
  requests: GatePassRequest[]
  onDecision: (requestId: string, decision: 'approved' | 'rejected', note: string) => void
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, requests, onDecision }) => {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [search, setSearch] = useState('')
  const [decisionModalState, setDecisionModalState] = useState<{
    request: GatePassRequest
    type: 'approve' | 'reject'
  } | null>(null)

  // Scope to staff department, or all requests if user has campus-wide purview
  const deptRequests = requests.filter((r) => !user.department || r.department === user.department)

  const pendingRequests = deptRequests.filter((r) => r.status === 'pending')
  const approvedCount = deptRequests.filter(
    (r) => r.status === 'approved' || r.status === 'completed',
  ).length
  const rejectedCount = deptRequests.filter((r) => r.status === 'rejected').length

  const filteredRequests = deptRequests.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.studentRollNo.toLowerCase().includes(q) ||
        r.passNumber.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
              Staff / Faculty Approver
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ID: {user.staffId || 'FAC-CE-108'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Pending Approval Desk</h2>
          <p className="text-slate-400 text-sm">
            {user.name} • {user.department || 'Computer Engineering'} Scope
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-2">
            <Clock size={16} className="text-amber-400 animate-pulse" />
            <span className="text-sm font-bold">{pendingRequests.length}</span>
            <span className="text-xs text-amber-200/80">Pending Action</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Pending Requests</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingRequests.length}</div>
          <p className="text-slate-500 text-[11px] mt-1">Awaiting verification & decision</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Approved Today</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{approvedCount}</div>
          <p className="text-slate-500 text-[11px] mt-1">Gate pass QR tokens generated</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Rejected Passes</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{rejectedCount}</div>
          <p className="text-slate-500 text-[11px] mt-1">Declined with logged reasons</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition whitespace-nowrap cursor-pointer ${
                filter === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab === 'pending'
                ? `Pending (${pendingRequests.length})`
                : tab === 'all'
                  ? `All (${deptRequests.length})`
                  : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or roll no..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Request Queue Cards */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <CheckCheck size={36} className="mx-auto text-emerald-500" />
            <h4 className="font-semibold text-white text-base">No requests in this queue</h4>
            <p className="text-xs text-slate-400">All student requests have been processed.</p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`p-5 rounded-2xl bg-slate-900 border transition shadow-lg ${
                req.status === 'pending'
                  ? 'border-amber-500/30 hover:border-amber-500/50'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  {/* Student Tag & Status */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-slate-400 font-semibold">
                      {req.passNumber}
                    </span>
                    <StatusBadge status={req.status} gateState={req.gateState} />
                    <span className="text-xs text-slate-500">Submitted: {req.createdAt}</span>
                  </div>

                  {/* Student Details */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-white">{req.studentName}</span>
                    <span className="text-slate-400 font-mono text-xs">({req.studentRollNo})</span>
                    <span className="text-xs text-slate-400">• {req.department}</span>
                  </div>

                  {/* Reason & Location */}
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    <span className="text-slate-400 font-normal">Reason: </span>
                    {req.reason}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-emerald-400" />
                      {req.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-amber-400" />
                      Window: {req.leaveTime} &rarr; {req.expectedReturnTime}
                    </span>
                  </div>

                  {/* Existing Decision Notes if already decided */}
                  {req.decisionNote && (
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
                      <span className="font-semibold text-slate-400">
                        Recorded Note ({req.decidedByName || 'Staff'}):{' '}
                      </span>
                      {req.decisionNote}
                    </div>
                  )}
                </div>

                {/* Action Buttons for Pending Requests */}
                {req.status === 'pending' ? (
                  <div className="flex sm:flex-col lg:flex-row items-center gap-2 shrink-0">
                    <button
                      onClick={() => setDecisionModalState({ request: req, type: 'reject' })}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
                    >
                      <XCircle size={15} className="text-rose-400" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => setDecisionModalState({ request: req, type: 'approve' })}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                    >
                      <CheckCircle size={15} />
                      <span>Approve & Issue QR</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-medium shrink-0 self-start lg:self-center">
                    Decided: {req.decidedAt || 'Processed'}
                  </div>
                )}
              </div>
            </div>
          ))
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
    </div>
  )
}
