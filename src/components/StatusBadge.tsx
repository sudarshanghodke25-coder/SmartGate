import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  ArrowRightCircle,
  RotateCcw,
  AlertTriangle,
  Flame,
} from 'lucide-react'
import type { PassStatus, GateEventState, PassPriority } from '../types'

interface StatusBadgeProps {
  status: PassStatus
  gateState?: GateEventState
  isOverdue?: boolean
  priority?: PassPriority
  size?: 'sm' | 'md' | 'lg'
}

export const StatusBadge = ({
  status,
  gateState,
  isOverdue,
  priority,
  size = 'md',
}: StatusBadgeProps) => {
  const sizeClasses = {
    sm: 'text-[11px] gap-1',
    md: 'text-xs font-semibold gap-1.5',
    lg: 'text-sm font-semibold gap-2',
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  const iconSize = iconSizes[size]

  if (status === 'approved' && gateState === 'exited' && isOverdue) {
    return (
      <span
        className={`inline-flex items-center font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap shrink-0 ${sizeClasses[size]}`}
      >
        <AlertTriangle size={iconSize} className="text-rose-600 dark:text-rose-400 shrink-0" />
        <span>Overdue Off-Campus</span>
      </span>
    )
  }

  if (status === 'approved' && gateState === 'exited') {
    return (
      <span
        className={`inline-flex items-center font-semibold text-indigo-700 dark:text-indigo-300 whitespace-nowrap shrink-0 ${sizeClasses[size]}`}
      >
        <ArrowRightCircle size={iconSize} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>Exited · Off Campus</span>
      </span>
    )
  }

  switch (status) {
    case 'pending':
      return (
        <span
          className={`inline-flex items-center font-semibold whitespace-nowrap shrink-0 ${
            priority === 'emergency'
              ? 'text-rose-600 dark:text-rose-300'
              : 'text-amber-700 dark:text-amber-300'
          } ${sizeClasses[size]}`}
        >
          {priority === 'emergency' ? (
            <Flame size={iconSize} className="text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <Clock size={iconSize} className="text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <span>{priority === 'emergency' ? 'Urgent SOS · Pending' : 'Pending Faculty Review'}</span>
        </span>
      )

    case 'approved':
      return (
        <span
          className={`inline-flex items-center font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap shrink-0 ${sizeClasses[size]}`}
        >
          <CheckCircle2 size={iconSize} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Approved · Ready at Gate</span>
        </span>
      )

    case 'completed':
      return (
        <span
          className={`inline-flex items-center font-semibold text-blue-700 dark:text-blue-300 whitespace-nowrap shrink-0 ${sizeClasses[size]}`}
        >
          <RotateCcw size={iconSize} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Completed · Returned</span>
        </span>
      )

    case 'rejected':
      return (
        <span
          className={`inline-flex items-center font-semibold text-rose-700 dark:text-rose-300 whitespace-nowrap shrink-0 ${sizeClasses[size]}`}
        >
          <XCircle size={iconSize} className="text-rose-600 dark:text-rose-400 shrink-0" />
          <span>Declined by Faculty</span>
        </span>
      )

    case 'expired':
      return (
        <span
          className={`inline-flex items-center font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0 ${sizeClasses[size]}`}
        >
          <AlertCircle size={iconSize} className="text-slate-500 dark:text-slate-400 shrink-0" />
          <span>Expired</span>
        </span>
      )

    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0 ${sizeClasses[size]}`}
        >
          <Ban size={iconSize} className="text-slate-500 shrink-0" />
          <span>Cancelled</span>
        </span>
      )

    default:
      return null
  }
}
