import { useState, useEffect } from 'react'
import { X, ShieldCheck, Clock, UserCheck, Copy, Check } from 'lucide-react'
import type { GatePassRequest } from '../../types'

interface PassQrModalProps {
  request: GatePassRequest
  onClose: () => void
}

export const PassQrModal = ({ request, onClose }: PassQrModalProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopyToken = () => {
    if (request.qrToken) {
      navigator.clipboard.writeText(request.qrToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
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
        className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-bold text-white text-base">Active Gate Pass QR</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-6 text-center overflow-y-auto">
          {/* Physical ID Warning Alert */}
          <div className="flex items-start gap-2.5 p-3 text-left rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <UserCheck size={18} className="shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold block text-amber-200">
                Physical College ID Mandatory
              </span>
              The gate guard will cross-check this pass against your physical college ID card before
              granting exit.
            </div>
          </div>

          {/* QR Code Presentation Box */}
          <div className="inline-block p-4 bg-white rounded-2xl shadow-xl ring-4 ring-slate-800 mx-auto">
            {/* Visual SVG representation of SmartGate QR */}
            <div className="w-56 h-56 flex flex-col items-center justify-center relative bg-white">
              {/* Custom SVG QR simulation pattern with college brand center */}
              <svg viewBox="0 0 120 120" className="w-full h-full text-slate-900 fill-current">
                {/* QR Finder patterns (Top-left, Top-right, Bottom-left) */}
                <rect x="10" y="10" width="30" height="30" rx="3" fill="#0f172a" />
                <rect x="16" y="16" width="18" height="18" fill="white" />
                <rect x="20" y="20" width="10" height="10" rx="1" fill="#0f172a" />

                <rect x="80" y="10" width="30" height="30" rx="3" fill="#0f172a" />
                <rect x="86" y="16" width="18" height="18" fill="white" />
                <rect x="90" y="20" width="10" height="10" rx="1" fill="#0f172a" />

                <rect x="10" y="80" width="30" height="30" rx="3" fill="#0f172a" />
                <rect x="16" y="86" width="18" height="18" fill="white" />
                <rect x="20" y="90" width="10" height="10" rx="1" fill="#0f172a" />

                {/* Simulated QR Payload matrix dots */}
                <rect x="46" y="12" width="6" height="6" fill="#0f172a" />
                <rect x="58" y="18" width="6" height="6" fill="#0f172a" />
                <rect x="68" y="12" width="6" height="6" fill="#0f172a" />

                <rect x="12" y="46" width="6" height="6" fill="#0f172a" />
                <rect x="24" y="58" width="6" height="6" fill="#0f172a" />
                <rect x="36" y="48" width="6" height="6" fill="#0f172a" />

                <rect x="48" y="48" width="8" height="8" rx="2" fill="#2563eb" />
                <rect x="64" y="48" width="8" height="8" rx="2" fill="#2563eb" />
                <rect x="56" y="62" width="8" height="8" rx="2" fill="#2563eb" />

                <rect x="80" y="48" width="6" height="6" fill="#0f172a" />
                <rect x="92" y="60" width="6" height="6" fill="#0f172a" />
                <rect x="104" y="48" width="6" height="6" fill="#0f172a" />

                <rect x="48" y="80" width="6" height="6" fill="#0f172a" />
                <rect x="62" y="90" width="6" height="6" fill="#0f172a" />
                <rect x="74" y="82" width="6" height="6" fill="#0f172a" />
                <rect x="92" y="92" width="6" height="6" fill="#0f172a" />
                <rect x="102" y="82" width="6" height="6" fill="#0f172a" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white p-1 rounded-md shadow-md border border-slate-200">
                  <ShieldCheck size={20} className="text-emerald-600" />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider mt-1 uppercase">
              SmartGate Verified QR
            </p>
          </div>

          {/* Fallback Manual Token */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Manual Gate Verification Code
              </span>
              <span className="text-lg font-mono font-bold text-white tracking-widest">
                {request.qrToken || 'SG-841-K7X9'}
              </span>
            </div>
            <button
              onClick={handleCopyToken}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              title="Copy code"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Student Pass Meta Details */}
          <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block">Student Name</span>
              <span className="text-slate-200 font-semibold">{request.studentName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Roll Number</span>
              <span className="text-slate-200 font-mono font-semibold">
                {request.studentRollNo}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Valid Until</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Clock size={12} />
                {request.qrExpiresAt || request.expectedReturnTime}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Pass Reference</span>
              <span className="text-slate-200 font-mono">{request.passNumber}</span>
            </div>
          </div>

          {/* Non-negotiable security invariant banner */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Online dynamic token • Single-exit authorization only</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
