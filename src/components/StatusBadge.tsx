import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  ArrowRightCircle,
  RotateCcw,
} from 'lucide-react'
import type { PassStatus, GateEventState } from '../types'

interface StatusBadgeProps {
  status: PassStatus
  gateState?: GateEventState
  size?: 'sm' | 'md' | 'lg'
}

export const StatusBadge = ({ status, gateState, size = 'md' }: StatusBadgeProps) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-semibold gap-2',
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  const iconSize = iconSizes[size]

  // If pass is approved, gateState provides critical gate transition clarity
  if (status === 'approved' && gateState === 'exited') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30 ${sizeClasses[size]}`}
      >
        <ArrowRightCircle size={iconSize} className="text-indigo-400" />
        <span>Exited (Off Campus)</span>
      </span>
    )
  }

  switch (status) {
    case 'pending':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30 ${sizeClasses[size]}`}
        >
          <Clock size={iconSize} className="text-amber-400" />
          <span>Pending Staff Review</span>
        </span>
      )

    case 'approved':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 ${sizeClasses[size]}`}
        >
          <CheckCircle2 size={iconSize} className="text-emerald-400" />
          <span>Approved (Ready for Gate)</span>
        </span>
      )

    case 'completed':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30 ${sizeClasses[size]}`}
        >
          <RotateCcw size={iconSize} className="text-blue-400" />
          <span>Completed (Returned)</span>
        </span>
      )

    case 'rejected':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30 ${sizeClasses[size]}`}
        >
          <XCircle size={iconSize} className="text-rose-400" />
          <span>Rejected by Staff</span>
        </span>
      )

    case 'expired':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30 ${sizeClasses[size]}`}
        >
          <AlertCircle size={iconSize} className="text-slate-400" />
          <span>Expired</span>
        </span>
      )

    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30 ${sizeClasses[size]}`}
        >
          <Ban size={iconSize} className="text-zinc-400" />
          <span>Cancelled</span>
        </span>
      )

    default:
      return null
  }
}
