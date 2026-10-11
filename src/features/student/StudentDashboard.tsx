import React, { useState } from 'react'
import { Plus, QrCode, Clock, MapPin, FileText, History } from 'lucide-react'
import type { UserProfile, GatePassRequest } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import { PassQrModal } from './PassQrModal'
import { NewRequestModal } from './NewRequestModal'

interface StudentDashboardProps {
  user: UserProfile
  requests: GatePassRequest[]
  onRequestCreate: (newReq: Partial<GatePassRequest>) => void
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  requests,
  onRequestCreate,
}) => {
  const [selectedPassForQr, setSelectedPassForQr] = useState<GatePassRequest | null>(null)
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)

  // Filter requests for current student
  const studentRequests = requests.filter(
    (r) => r.studentId === user.id || r.studentRollNo === user.rollNo,
  )

  // Find currently active approved pass (approved and either no_exit or exited)
  const activePass = studentRequests.find(
    (r) => r.status === 'approved' || (r.status === 'completed' && false),
  )

  const pendingCount = studentRequests.filter((r) => r.status === 'pending').length
  const completedCount = studentRequests.filter((r) => r.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Welcome & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
              Student Portal
            </span>
            <span className="text-xs text-slate-400 font-mono">Roll: {user.rollNo}</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {user.name}
          </h2>
          <p className="text-slate-400 text-sm">
            {user.department} • Manage exit requests and view active gate passes.
          </p>
        </div>

        <button
          onClick={() => setIsNewRequestOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/25 transition cursor-pointer shrink-0"
        >
          <Plus size={18} />
          <span>Request Gate Pass</span>
        </button>
      </div>

      {/* Active Pass Spotlight (if exists) */}
      {activePass && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold ring-1 ring-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Active Authorized Pass
                </span>
                <span className="font-mono text-xs text-slate-400 font-medium">
                  {activePass.passNumber}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{activePass.reason}</h3>
                <p className="text-slate-300 text-xs flex items-center gap-1.5 mt-1">
                  <MapPin size={13} className="text-emerald-400" />
                  Destination: {activePass.destination}
                </p>
              </div>

              {activePass.decisionNote && (
                <div className="text-xs p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300">
                  <span className="text-emerald-400 font-semibold block">
                    Staff Approval Note ({activePass.decidedByName}):
                  </span>
                  {activePass.decisionNote}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-amber-400" />
                  Valid until: {activePass.qrExpiresAt || activePass.expectedReturnTime}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Guard check: Physical ID required</span>
              </div>
            </div>

            {/* Quick Action Button to Open QR */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3">
              <button
                onClick={() => setSelectedPassForQr(activePass)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-xl shadow-emerald-600/30 transition cursor-pointer"
              >
                <QrCode size={18} />
                <span>Show Gate Pass QR</span>
              </button>
              <span className="text-[11px] text-slate-400 font-mono text-center">
                Code: {activePass.qrToken}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Pending Review</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</div>
          <p className="text-slate-500 text-[11px] mt-1">Awaiting authorized faculty approval</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Active Passes</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{activePass ? 1 : 0}</div>
          <p className="text-slate-500 text-[11px] mt-1">Ready for security gate verification</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Completed Passes</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{completedCount}</div>
          <p className="text-slate-500 text-[11px] mt-1">
            Recorded exits with verified safe return
          </p>
        </div>
      </div>

      {/* Pass History / Requests List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            <h3 className="font-bold text-white text-base">My Gate Pass Requests</h3>
          </div>
          <span className="text-xs text-slate-400">{studentRequests.length} total records</span>
        </div>

        <div className="divide-y divide-slate-800">
          {studentRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText size={36} className="mx-auto text-slate-600" />
              <p className="text-slate-400 text-sm">No gate pass requests yet.</p>
              <button
                onClick={() => setIsNewRequestOpen(true)}
                className="text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Create your first request &rarr;
              </button>
            </div>
          ) : (
            studentRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-slate-400 font-semibold">
                      {req.passNumber}
                    </span>
                    <StatusBadge status={req.status} gateState={req.gateState} />
                    <span className="text-xs text-slate-500">Created: {req.createdAt}</span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-200">{req.reason}</h4>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-slate-500" />
                      {req.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-500" />
                      Leave: {req.leaveTime} | Return by: {req.expectedReturnTime}
                    </span>
                  </div>

                  {req.decisionNote && (
                    <p className="text-xs text-slate-400 italic">
                      Note from {req.decidedByName || 'Staff'}: "{req.decisionNote}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {req.status === 'approved' && (
                    <button
                      onClick={() => setSelectedPassForQr(req)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
                    >
                      <QrCode size={14} className="text-emerald-400" />
                      <span>View Pass</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedPassForQr && (
        <PassQrModal request={selectedPassForQr} onClose={() => setSelectedPassForQr(null)} />
      )}

      {isNewRequestOpen && (
        <NewRequestModal
          user={user}
          onClose={() => setIsNewRequestOpen(false)}
          onSubmit={onRequestCreate}
        />
      )}
    </div>
  )
}
