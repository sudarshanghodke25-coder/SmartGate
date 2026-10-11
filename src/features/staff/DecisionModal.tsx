import React, { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import type { GatePassRequest } from '../../types'

interface DecisionModalProps {
  request: GatePassRequest
  decisionType: 'approve' | 'reject'
  onClose: () => void
  onConfirm: (requestId: string, decision: 'approved' | 'rejected', note: string) => void
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  request,
  decisionType,
  onClose,
  onConfirm,
}) => {
  const [note, setNote] = useState(
    decisionType === 'approve'
      ? 'Verified and approved for requested duration.'
      : 'Request rejected per campus attendance guidelines.',
  )
  const isApprove = decisionType === 'approve'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(request.id, isApprove ? 'approved' : 'rejected', note.trim())
    onClose()
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b border-slate-800 ${
            isApprove ? 'bg-emerald-950/30' : 'bg-rose-950/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {isApprove ? (
              <CheckCircle size={20} className="text-emerald-400" />
            ) : (
              <XCircle size={20} className="text-rose-400" />
            )}
            <h3 className="font-bold text-white text-base">
              {isApprove ? 'Approve Gate Pass' : 'Reject Gate Pass'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Student:</span>
              <span className="font-semibold text-slate-200">
                {request.studentName} ({request.studentRollNo})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Reason:</span>
              <span className="text-slate-300 font-medium text-right max-w-[240px] truncate">
                {request.reason}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Expected Timings:</span>
              <span className="text-slate-300">
                {request.leaveTime} &rarr; {request.expectedReturnTime}
              </span>
            </div>
          </div>

          {/* Decision Note Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Staff Decision Note / Verification Details
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add optional notes (e.g. parent call verified, emergency confirmed)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition resize-none"
            />
          </div>

          {/* Invariant S1/S2 Info */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <span className="text-slate-300 font-semibold block">Audited Staff Operation</span>
            <span>
              This decision will be timestamped and permanently logged in the tamper-evident campus
              audit trail under your faculty credential.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg transition cursor-pointer ${
                isApprove
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              {isApprove ? <CheckCircle size={16} /> : <XCircle size={16} />}
              <span>{isApprove ? 'Confirm Approval' : 'Confirm Rejection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
