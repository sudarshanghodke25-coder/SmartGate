import React, { useState } from 'react'
import {
  Scan,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Wifi,
  WifiOff,
  History,
} from 'lucide-react'
import type { UserProfile, GatePassRequest, GateEvent } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'

interface GuardDashboardProps {
  user: UserProfile
  requests: GatePassRequest[]
  gateEvents: GateEvent[]
  onRecordExit: (requestId: string, physicalConfirmed: boolean) => void
  onRecordReturn: (requestId: string, physicalConfirmed: boolean) => void
}

export const GuardDashboard: React.FC<GuardDashboardProps> = ({
  user,
  requests,
  gateEvents,
  onRecordExit,
  onRecordReturn,
}) => {
  const [tokenInput, setTokenInput] = useState('SG-841-K7X9')
  const [isOnline, setIsOnline] = useState(true)
  const [physicalIdChecked, setPhysicalIdChecked] = useState(false)
  const [lookupMessage, setLookupMessage] = useState<{
    type: 'success' | 'error' | 'warning'
    text: string
  } | null>(null)

  // Current verified pass in the buffer
  const [activeVerifiedPass, setActiveVerifiedPass] = useState<GatePassRequest | null>(null)

  // Handle Token Scan / Verification
  const handleVerify = (tokenToTest?: string) => {
    const token = (tokenToTest || tokenInput).trim().toUpperCase()
    setLookupMessage(null)
    setPhysicalIdChecked(false)

    // Non-negotiable Invariant S5: Fail Closed if offline
    if (!isOnline) {
      setActiveVerifiedPass(null)
      setLookupMessage({
        type: 'error',
        text: 'ONLINE VERIFICATION UNAVAILABLE (S5): Security invariant requires online server verification. App strictly fails closed. Refer to manual college logbook protocol.',
      })
      return
    }

    if (!token) {
      setLookupMessage({
        type: 'warning',
        text: 'Please scan or type a gate pass verification token.',
      })
      return
    }

    // Find pass by qrToken or passNumber
    const found = requests.find(
      (r) => r.qrToken?.toUpperCase() === token || r.passNumber.toUpperCase() === token,
    )

    if (!found) {
      setActiveVerifiedPass(null)
      setLookupMessage({
        type: 'error',
        text: `Invalid or unrecognized token "${token}". No matching approved record found.`,
      })
      return
    }

    // Check pass status
    if (found.status === 'expired') {
      setActiveVerifiedPass(found)
      setLookupMessage({
        type: 'error',
        text: `DENIED (S9): Pass ${found.passNumber} has expired. Gate exit cannot be authorized.`,
      })
      return
    }

    if (found.status === 'rejected') {
      setActiveVerifiedPass(found)
      setLookupMessage({
        type: 'error',
        text: `DENIED: Pass ${found.passNumber} was rejected by staff. Exit unauthorized.`,
      })
      return
    }

    if (found.status === 'pending') {
      setActiveVerifiedPass(found)
      setLookupMessage({
        type: 'error',
        text: `DENIED: Pass ${found.passNumber} is still pending staff approval.`,
      })
      return
    }

    // Pass is approved or completed
    setActiveVerifiedPass(found)
    if (found.gateState === 'exited') {
      setLookupMessage({
        type: 'warning',
        text: `Student is currently EXITED off-campus. Ready for RETURN verification.`,
      })
    } else if (found.gateState === 'returned') {
      setLookupMessage({
        type: 'warning',
        text: `Pass ${found.passNumber} has already been completed and returned.`,
      })
    } else {
      setLookupMessage({
        type: 'success',
        text: `Pass ${found.passNumber} is online-verified. Check physical college ID card to authorize exit.`,
      })
    }
  }

  // Handle Record Exit
  const handleExitClick = () => {
    if (!activeVerifiedPass) return
    if (!physicalIdChecked) {
      setLookupMessage({
        type: 'error',
        text: 'INVARIANT S6: Guard must explicitly confirm physical college ID before recording exit.',
      })
      return
    }

    onRecordExit(activeVerifiedPass.id, true)
    setLookupMessage({
      type: 'success',
      text: `EXIT RECORDED: ${activeVerifiedPass.studentName} has been authorized to exit gate.`,
    })
    // Re-sync local state
    setActiveVerifiedPass({
      ...activeVerifiedPass,
      gateState: 'exited',
      actualExitTime: 'Just now',
    })
    setPhysicalIdChecked(false)
  }

  // Handle Record Return
  const handleReturnClick = () => {
    if (!activeVerifiedPass) return
    if (!physicalIdChecked) {
      setLookupMessage({
        type: 'error',
        text: 'INVARIANT S6: Guard must inspect physical college ID before recording student return.',
      })
      return
    }

    onRecordReturn(activeVerifiedPass.id, true)
    setLookupMessage({
      type: 'success',
      text: `RETURN RECORDED: ${activeVerifiedPass.studentName} safe return recorded at gate.`,
    })
    setActiveVerifiedPass({
      ...activeVerifiedPass,
      status: 'completed',
      gateState: 'returned',
      actualReturnTime: 'Just now',
    })
    setPhysicalIdChecked(false)
  }

  return (
    <div className="space-y-6">
      {/* Guard Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              Security Gate Terminal
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Guard: {user.name} ({user.staffId || 'GATE-01'})
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Gate Pass Verification & Access
          </h2>
          <p className="text-slate-400 text-sm">
            Main Campus Security Post • Strict physical ID confirmation mandatory.
          </p>
        </div>

        {/* Network Online/Offline Simulator (Invariant S5 demo) */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 px-2">
            {isOnline ? (
              <Wifi size={16} className="text-emerald-400" />
            ) : (
              <WifiOff size={16} className="text-rose-400 animate-pulse" />
            )}
            <span
              className={`text-xs font-semibold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {isOnline ? 'Gate Online (Active)' : 'Offline (Fail Closed)'}
            </span>
          </div>
          <button
            onClick={() => {
              setIsOnline(!isOnline)
              setLookupMessage(null)
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
          >
            Toggle S5 Outage
          </button>
        </div>
      </div>

      {/* Main Verification Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scanner & Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Scan size={20} className="text-blue-400" />
              <span>Scan QR / Enter Pass Code</span>
            </div>

            {/* Token Input Form */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Gate Pass Code or Scanned Token
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="e.g. SG-841-K7X9"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-base font-bold text-white tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/40 uppercase"
                />
                <button
                  onClick={() => handleVerify()}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer shrink-0"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Test Scenarios Quick Chips */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">
                Quick test codes (Click to test):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setTokenInput('SG-841-K7X9')
                    handleVerify('SG-841-K7X9')
                  }}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono hover:bg-emerald-500/20 transition cursor-pointer"
                >
                  ✓ Approved Pass (SG-841-K7X9)
                </button>
                <button
                  onClick={() => {
                    setTokenInput('SG-835-Z9Y1')
                    handleVerify('SG-835-Z9Y1')
                  }}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-mono hover:bg-slate-700 transition cursor-pointer"
                >
                  ✕ Expired Pass (SG-835-Z9Y1)
                </button>
                <button
                  onClick={() => {
                    setTokenInput('SG-840-M3F2')
                    handleVerify('SG-840-M3F2')
                  }}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono hover:bg-blue-500/20 transition cursor-pointer"
                >
                  ↺ Completed (SG-840-M3F2)
                </button>
              </div>
            </div>

            {/* Security Rules Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                Gate Invariants Enforced
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
                <li>S5: Online verification mandatory; fail-closed.</li>
                <li>S6: Explicit physical college ID check required.</li>
                <li>S7: Single exit only per pass cycle.</li>
                <li>S8: Return allowed only if exit already recorded.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Results & Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserCheck size={20} className="text-emerald-400" />
                Verification & Identity Match
              </h3>
              {activeVerifiedPass && (
                <StatusBadge
                  status={activeVerifiedPass.status}
                  gateState={activeVerifiedPass.gateState}
                  size="md"
                />
              )}
            </div>

            {/* Message Alert Banner */}
            {lookupMessage && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
                  lookupMessage.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : lookupMessage.type === 'error'
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                }`}
              >
                {lookupMessage.type === 'success' ? (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />
                ) : lookupMessage.type === 'error' ? (
                  <XCircle size={18} className="shrink-0 text-rose-400 mt-0.5" />
                ) : (
                  <AlertTriangle size={18} className="shrink-0 text-amber-400 mt-0.5" />
                )}
                <span className="leading-relaxed font-medium">{lookupMessage.text}</span>
              </div>
            )}

            {/* Student Identity Card (Minimal data display per P9) */}
            {activeVerifiedPass ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">
                        Student Identity
                      </span>
                      <h4 className="text-base font-bold text-white">
                        {activeVerifiedPass.studentName}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">
                        Roll Number
                      </span>
                      <span className="font-mono text-base font-bold text-emerald-400">
                        {activeVerifiedPass.studentRollNo}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Department</span>
                      <span className="text-slate-200 font-medium">
                        {activeVerifiedPass.department}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Valid Until</span>
                      <span className="text-slate-200 font-medium">
                        {activeVerifiedPass.qrExpiresAt || activeVerifiedPass.expectedReturnTime}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block">Approved Purpose</span>
                      <span className="text-slate-300">{activeVerifiedPass.reason}</span>
                    </div>
                  </div>
                </div>

                {/* S6: Explicit Physical College ID Confirmation Checkbox */}
                <div
                  className={`p-4 rounded-xl border transition ${
                    physicalIdChecked
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={physicalIdChecked}
                      onChange={(e) => setPhysicalIdChecked(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/40 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white block">
                        Confirm Physical College ID Card Match (S6)
                      </span>
                      <span className="text-slate-300 leading-relaxed">
                        I confirm that I have inspected the student's physical college ID card,
                        compared their photo, and verified the roll number (
                        {activeVerifiedPass.studentRollNo}) matches.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Gate Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Record Exit Button */}
                  <button
                    onClick={handleExitClick}
                    disabled={
                      activeVerifiedPass.status !== 'approved' ||
                      activeVerifiedPass.gateState !== 'no_exit' ||
                      !physicalIdChecked ||
                      !isOnline
                    }
                    className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold transition shadow-lg ${
                      activeVerifiedPass.status === 'approved' &&
                      activeVerifiedPass.gateState === 'no_exit' &&
                      physicalIdChecked &&
                      isOnline
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <ArrowRight size={18} />
                    <span>Authorize & Record Exit</span>
                  </button>

                  {/* Record Return Button */}
                  <button
                    onClick={handleReturnClick}
                    disabled={
                      activeVerifiedPass.gateState !== 'exited' || !physicalIdChecked || !isOnline
                    }
                    className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold transition shadow-lg ${
                      activeVerifiedPass.gateState === 'exited' && physicalIdChecked && isOnline
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <RotateCcw size={18} />
                    <span>Record Safe Return</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <Scan size={36} className="mx-auto text-slate-600" />
                <h4 className="font-semibold text-white text-sm">
                  Ready for Gate Pass Verification
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Scan the student's mobile QR code or type their 6-character code above to begin
                  identity verification.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Gate Activity Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            <h3 className="font-bold text-white text-base">Recent Gate Log (Main Gate)</h3>
          </div>
          <span className="text-xs text-slate-400">{gateEvents.length} recorded events</span>
        </div>

        <div className="divide-y divide-slate-800">
          {gateEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-4 hover:bg-slate-800/40 transition flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    evt.eventType === 'exit'
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}
                >
                  {evt.eventType === 'exit' ? <ArrowRight size={16} /> : <RotateCcw size={16} />}
                </div>

                <div>
                  <div className="font-bold text-white text-sm">
                    {evt.studentName}{' '}
                    <span className="font-mono text-slate-400 text-xs font-normal">
                      ({evt.studentRollNo})
                    </span>
                  </div>
                  <div className="text-slate-400 mt-0.5">
                    {evt.note || 'Gate authorization logged.'}
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="font-medium text-slate-300 block">{evt.timestamp}</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <ShieldCheck size={12} />
                  ID Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
