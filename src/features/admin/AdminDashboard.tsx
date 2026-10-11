import React, { useState } from 'react'
import { FileText, Activity, Search, ArrowRight, RotateCcw, Sliders, Lock } from 'lucide-react'
import type { UserProfile, GatePassRequest, GateEvent, AuditEvent } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'

interface AdminDashboardProps {
  user: UserProfile
  requests: GatePassRequest[]
  gateEvents: GateEvent[]
  auditLogs: AuditEvent[]
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  requests,
  gateEvents,
  auditLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'passes' | 'events' | 'audit' | 'policies'>('passes')
  const [search, setSearch] = useState('')

  const activeOffCampus = requests.filter((r) => r.gateState === 'exited').length
  const totalCompleted = requests.filter((r) => r.status === 'completed').length
  const pendingApprovals = requests.filter((r) => r.status === 'pending').length

  const filteredRequests = requests.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.studentRollNo.toLowerCase().includes(q) ||
      r.passNumber.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
              Campus Administration & Audit
            </span>
            <span className="text-xs text-slate-400 font-mono">Admin: {user.name}</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Central Gate Control & Audits
          </h2>
          <p className="text-slate-400 text-sm">
            Comprehensive college overview, pass registry, and tamper-evident logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5">
            <Lock size={14} className="text-purple-400" />
            <span>Audit Trail Protected (S10)</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Total Passes Issued</div>
          <div className="text-2xl font-bold text-white mt-1">{requests.length}</div>
          <p className="text-slate-500 text-[11px] mt-1">All historical records</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Currently Off-Campus</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{activeOffCampus}</div>
          <p className="text-slate-500 text-[11px] mt-1">Exited via gate; awaiting return</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Completed Returns</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{totalCompleted}</div>
          <p className="text-slate-500 text-[11px] mt-1">Full exit-return cycle verified</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Pending Approvals</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{pendingApprovals}</div>
          <p className="text-slate-500 text-[11px] mt-1">Queued with faculty</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('passes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'passes'
              ? 'border-blue-500 text-white bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={15} />
          <span>All Pass Records</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'events'
              ? 'border-blue-500 text-white bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity size={15} />
          <span>Gate Events ({gateEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'audit'
              ? 'border-blue-500 text-white bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Lock size={15} />
          <span>Immutable Audit Log ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'policies'
              ? 'border-blue-500 text-white bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sliders size={15} />
          <span>College Policy Status (P1-P13)</span>
        </button>
      </div>

      {/* Tab 1: Passes Table */}
      {activeTab === 'passes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="font-bold text-white text-sm">Gate Pass Master Registry</h3>
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter passes or roll no..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Pass #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Reason / Destination</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Decided By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      {r.passNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{r.studentName}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{r.studentRollNo}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{r.department}</td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <span className="text-slate-200 font-medium block truncate">{r.reason}</span>
                      <span className="text-slate-400 text-[11px] block truncate">
                        {r.destination}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} gateState={r.gateState} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-400">{r.decidedByName || 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Gate Events */}
      {activeTab === 'events' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">Gate Access Logbook</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {gateEvents.map((evt) => (
              <div key={evt.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      evt.eventType === 'exit'
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {evt.eventType === 'exit' ? <ArrowRight size={16} /> : <RotateCcw size={16} />}
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      {evt.studentName} ({evt.studentRollNo}) —{' '}
                      <span className="uppercase text-[11px] font-semibold text-slate-300">
                        {evt.eventType}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Pass Ref: {evt.passNumber} • Gate: {evt.gateLocation} • Guard: {evt.guardName}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-300 font-mono block">{evt.timestamp}</span>
                  <span className="text-emerald-400 text-[11px]">Physical ID Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Immutable Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Append-Only Security Audit Trail</h3>
              <p className="text-slate-400 text-xs">
                Per Invariant S10: Audit history is immutable and cannot be altered or deleted.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold ring-1 ring-emerald-500/20">
              Integrity Verified
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-purple-400 font-bold uppercase text-[11px] px-2 py-0.5 rounded bg-purple-500/10">
                      {log.action}
                    </span>
                    <span className="text-slate-300 font-medium">{log.actorName}</span>
                    <span className="text-slate-500">({log.actorRole})</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Metadata:{' '}
                    <code className="text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {JSON.stringify(log.metadata)}
                    </code>
                  </div>
                </div>

                <div className="text-slate-400 font-mono text-[11px] shrink-0 self-start sm:self-center">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: College Policy Decisions */}
      {activeTab === 'policies' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">
              College Policy Configuration (From docs/DECISIONS.md)
            </h3>
            <p className="text-xs text-slate-400">
              The following college policies are marked as awaiting administrative ratification per
              project rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 block">P1: Staff Approval Scope</span>
              <p className="text-slate-400 leading-relaxed">
                Assigned to Department Faculty & HODs. Cross-department approvals currently
                restricted to Central Admin.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 block">P5: Pass QR Token Expiry</span>
              <p className="text-slate-400 leading-relaxed">
                Default: 4 hours from issuance or until specified return time. Return recording
                permitted past expiry if exit was already recorded (S9).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 block">
                P7 & P8: ID Mismatch & Outage Protocol
              </span>
              <p className="text-slate-400 leading-relaxed">
                App fails closed (S5). Physical college ID mismatch triggers gate denial and
                referral to main administrative security office.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 block">
                P13: Student Privacy & Synthetic Data
              </span>
              <p className="text-slate-400 leading-relaxed">
                Prototype operates exclusively on synthetic diploma student profiles. Zero
                production student PII exposed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
