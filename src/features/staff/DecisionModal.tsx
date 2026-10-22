import React, { useState } from 'react'
import { X, CheckCircle, XCircle, Flame, Phone, FileSpreadsheet } from 'lucide-react'
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
  const isApprove = decisionType === 'approve'
  const [note, setNote] = useState(
    isApprove
      ? request.priority === 'emergency'
        ? 'Priority SOS verified. Immediate hospital/medical exit authorized.'
        : 'Verified student ID, reason, and parent contact. Approved for requested duration.'
      : 'Request declined per campus attendance guidelines.',
  )

  const quickNotes = isApprove
    ? [
        'Verified appointment slip & parent confirmation.',
        'Approved for official diploma lab fabrication purchase.',
        'Emergency medical exit authorized — notify hostel warden.',
      ]
    : [
        'Scheduled core practical lab in progress.',
        'Supporting document or parent approval missing.',
        'Personal outing not permitted during academic hours.',
      ]

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 ${
            isApprove
              ? 'bg-emerald-50 dark:bg-emerald-950/30'
              : 'bg-rose-50 dark:bg-rose-950/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {isApprove ? (
              <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle size={18} className="text-rose-600 dark:text-rose-400" />
            )}
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isApprove ? 'Approve Receipt & Issue QR' : 'Decline Gate Pass Request'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {request.priority === 'emergency' && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-200">
              <Flame size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Urgent Emergency SOS Request — High-priority triage</span>
            </div>
          )}

          {/* Summary Box */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <FileSpreadsheet size={12} /> Pass / Receipt
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {request.passNumber} · {request.receiptNumber || 'RCPT-2026-8801'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Student</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {request.studentName} ({request.studentRollNo})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Student ID</span>
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                {request.collegeStudentId || 'STU-2026-1042'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Reason</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium text-right max-w-[240px] truncate">
                {request.reason}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Leave Window</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                {request.leaveTime} &rarr; {request.expectedReturnTime}
              </span>
            </div>
            {request.guardianPhone && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Phone size={11} /> Guardian Contact
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {request.guardianName ? `${request.guardianName} · ` : ''}
                  {request.guardianPhone}
                </span>
              </div>
            )}
          </div>

          {/* Decision Note Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Faculty Decision Note (Printed on Pass Receipt & Audit Log)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter verification note..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition resize-none"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickNotes.map((qn, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNote(qn)}
                  className="text-[11px] px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer text-left"
                >
                  + {qn.slice(0, 34)}...
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-white font-semibold text-xs transition cursor-pointer whitespace-nowrap ${
                isApprove ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {isApprove ? <CheckCircle size={15} /> : <XCircle size={15} />}
              <span>{isApprove ? 'Confirm Approval & Issue QR' : 'Confirm Rejection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
