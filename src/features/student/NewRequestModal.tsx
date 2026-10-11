import React, { useState } from 'react'
import { X, Send, Building2, AlertCircle, Clock, MapPin, FileText } from 'lucide-react'
import type { UserProfile, GatePassRequest } from '../../types'

interface NewRequestModalProps {
  user: UserProfile
  onClose: () => void
  onSubmit: (newReq: Partial<GatePassRequest>) => void
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({ user, onClose, onSubmit }) => {
  const [reason, setReason] = useState('')
  const [destination, setDestination] = useState('')
  const [leaveTime, setLeaveTime] = useState('Today, 03:00 PM')
  const [expectedReturnTime, setExpectedReturnTime] = useState('Today, 05:30 PM')
  const [error, setError] = useState<string | null>(null)

  const reasonPresets = [
    'Medical consultation at hospital/clinic',
    'Official academic document verification at university',
    'Component purchase for diploma engineering project',
    'Urgent family banking / government agency errand',
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || reason.trim().length < 8) {
      setError('Please provide a specific reason (at least 8 characters).')
      return
    }
    if (!destination.trim() || destination.trim().length < 3) {
      setError('Please specify the destination location/address.')
      return
    }
    if (!expectedReturnTime.trim()) {
      setError('Please provide an expected return time.')
      return
    }

    setError(null)
    onSubmit({
      reason: reason.trim(),
      destination: destination.trim(),
      leaveTime,
      expectedReturnTime,
      department: user.department || 'Diploma Engineering',
      year: 'Year 3 (Diploma)',
    })
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
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h3 className="font-bold text-white text-base">Request Gate Pass</h3>
            <p className="text-xs text-slate-400">
              Submit an exit request for authorized staff review
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Info Box (Read-only from profile) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Student Name</span>
              <span className="text-slate-200 font-semibold">{user.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Roll Number</span>
              <span className="text-slate-200 font-mono font-semibold">
                {user.rollNo || 'CO-2024-042'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block">Department & Batch</span>
              <span className="text-slate-300">
                {user.department || 'Computer Engineering'} — Year 3 (Diploma)
              </span>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText size={14} className="text-blue-400" />
                Reason for Campus Exit *
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Min 8 characters</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Medical consultation at Apex Specialty Clinic with appointment..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition resize-none"
            />
            {/* Reason Presets */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 block">Quick templates:</span>
              <div className="flex flex-wrap gap-1.5">
                {reasonPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(preset)}
                    className="text-[11px] px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-left"
                  >
                    + {preset.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-400" />
              Specific Destination / Location *
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="E.g., Apex Specialty Clinic, College Road"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
            />
          </div>

          {/* Timings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock size={14} className="text-amber-400" />
                Proposed Exit Time
              </label>
              <input
                type="text"
                value={leaveTime}
                onChange={(e) => setLeaveTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-400" />
                Expected Return Time *
              </label>
              <input
                type="text"
                value={expectedReturnTime}
                onChange={(e) => setExpectedReturnTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          {/* Staff Routing Notice */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2">
            <Building2 size={16} className="shrink-0 text-blue-400 mt-0.5" />
            <div>
              <span className="font-semibold block text-blue-200">
                Authorized Department Review
              </span>
              Your request will be routed directly to Computer Engineering faculty approvers. Once
              decided, your status will update in real time.
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/20 transition cursor-pointer"
            >
              <Send size={15} />
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
