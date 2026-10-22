import React, { useState } from 'react'
import {
  X,
  Send,
  AlertCircle,
  CalendarClock,
  MapPin,
  FileText,
  Flame,
  Phone,
  Paperclip,
  IdCard,
} from 'lucide-react'
import type {
  UserProfile,
  GatePassRequest,
  PassCategory,
  PassPriority,
  CampusPolicyConfig,
} from '../../types'
import {
  formatAccurateDateTime,
  getLocalDateTimeInputValue,
} from '../../lib/qrAndExport'

interface NewRequestModalProps {
  user: UserProfile
  policies?: CampusPolicyConfig
  initialEmergency?: boolean
  onClose: () => void
  onSubmit: (newReq: Partial<GatePassRequest>) => void
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  user,
  policies,
  initialEmergency = false,
  onClose,
  onSubmit,
}) => {
  const [category, setCategory] = useState<PassCategory>(
    initialEmergency ? 'medical_sos' : 'academic',
  )
  const [priority, setPriority] = useState<PassPriority>(
    initialEmergency ? 'emergency' : 'normal',
  )
  const [reason, setReason] = useState(
    initialEmergency ? 'Urgent medical consultation at City Care Hospital' : '',
  )
  const [destination, setDestination] = useState(
    initialEmergency ? 'City Care Hospital, Civil Lines' : '',
  )
  const [leaveDateTimeInput, setLeaveDateTimeInput] = useState(() =>
    getLocalDateTimeInputValue(15),
  )
  const [returnDateTimeInput, setReturnDateTimeInput] = useState(() =>
    getLocalDateTimeInputValue(165),
  )
  const [studentPhone, setStudentPhone] = useState(user.phone || '+91 98201 12345')
  const [guardianName, setGuardianName] = useState(user.guardianName || 'Rajesh Sharma')
  const [guardianPhone, setGuardianPhone] = useState(user.guardianPhone || '+91 98201 99881')
  const [attachmentLabel, setAttachmentLabel] = useState('')
  const [error, setError] = useState<string | null>(null)

  const curfewTime = policies?.campusCurfewTime || '06:30 PM'

  const reasonPresets: {
    label: string
    category: PassCategory
    priority: PassPriority
    dest: string
  }[] = [
    {
      label: 'Emergency medical care / prescription pickup at hospital',
      category: 'medical_sos',
      priority: 'emergency',
      dest: 'Apex Specialty Clinic, College Road',
    },
    {
      label: 'Component purchase for final-year diploma hardware project',
      category: 'academic',
      priority: 'normal',
      dest: 'Industrial Electronics Market, MIDC',
    },
    {
      label: 'Official scholarship document verification at Tehsil office',
      category: 'official',
      priority: 'normal',
      dest: 'Central Tehsil Office, Station Square',
    },
    {
      label: 'Urgent education loan bank passbook attestation',
      category: 'official',
      priority: 'normal',
      dest: 'State Bank of India, Main Road',
    },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || reason.trim().length < 8) {
      setError('Please provide a specific reason (at least 8 characters).')
      return
    }
    if (!destination.trim() || destination.trim().length < 3) {
      setError('Please specify the destination location or address.')
      return
    }
    if (!leaveDateTimeInput || !returnDateTimeInput) {
      setError('Please select valid Leave and Expected Return dates and times.')
      return
    }

    const leaveDate = new Date(leaveDateTimeInput)
    const returnDate = new Date(returnDateTimeInput)
    if (returnDate <= leaveDate) {
      setError('Expected Return Date & Time must be after the Scheduled Leave Date & Time.')
      return
    }

    if (guardianPhone.trim().length < 8) {
      setError('A valid Parent / Guardian emergency phone number is required for your pass receipt.')
      return
    }

    setError(null)
    onSubmit({
      category,
      priority,
      reason: reason.trim(),
      destination: destination.trim(),
      leaveTime: formatAccurateDateTime(leaveDate, false),
      leaveDateTimeISO: leaveDate.toISOString(),
      expectedReturnTime: formatAccurateDateTime(returnDate, false),
      expectedReturnDateTimeISO: returnDate.toISOString(),
      studentPhone: studentPhone.trim(),
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      guardianNotified: priority === 'emergency',
      guardianNotifiedAt:
        priority === 'emergency' ? formatAccurateDateTime(new Date(), true) : undefined,
      attachmentLabel: attachmentLabel.trim() || undefined,
      department: user.department || 'Computer Engineering',
      year: user.year || 'Year 3 (Diploma)',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              {priority === 'emergency'
                ? 'Request Urgent Emergency SOS Gate Pass'
                : 'New Gate Pass & Receipt Application'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {user.name} · Roll: {user.rollNo} · ID: {user.studentId || 'STU-2026-1042'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Validated Credentials Preview */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Student Name</span>
              <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Roll No & ID</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {user.rollNo} · {user.studentId || 'STU-2026-1042'}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase text-slate-400 block">Dept & Year</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {user.department} ({user.year || 'Year 3'})
              </span>
            </div>
          </div>

          {/* Priority Mode Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPriority('normal')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                priority === 'normal'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Standard Gate Pass
            </button>
            <button
              type="button"
              onClick={() => {
                setPriority('emergency')
                setCategory('medical_sos')
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                priority === 'emergency'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              <Flame size={14} />
              <span>Urgent Emergency / SOS</span>
            </button>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Pass Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'medical_sos', label: 'Medical / SOS' },
                  { id: 'academic', label: 'Academic / Lab' },
                  { id: 'official', label: 'Official Errand' },
                  { id: 'personal', label: 'Personal' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
                    category === cat.id
                      ? 'bg-blue-50 dark:bg-slate-800 border-blue-500 text-blue-700 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <FileText size={14} className="text-blue-500" />
                Reason for Campus Exit *
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Printed on Pass Receipt</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide specific reason for leaving campus..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {reasonPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReason(preset.label)
                    setCategory(preset.category)
                    setPriority(preset.priority)
                    setDestination(preset.dest)
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-400 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  + {preset.label.slice(0, 36)}...
                </button>
              ))}
            </div>
          </div>

          {/* Destination & Supporting Attachment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <MapPin size={14} className="text-emerald-500" />
                Specific Destination *
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Apex Clinic, College Road"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Paperclip size={14} className="text-slate-400" />
                Supporting Document Ref
              </label>
              <input
                type="text"
                value={attachmentLabel}
                onChange={(e) => setAttachmentLabel(e.target.value)}
                placeholder="e.g. Clinic_Appointment_402.pdf"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Accurate Real-Time Date & Time Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-blue-50/50 dark:bg-slate-950 border border-blue-200/70 dark:border-slate-800">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <CalendarClock size={14} className="text-blue-500" />
                Scheduled Leave Date & Time *
              </label>
              <input
                type="datetime-local"
                value={leaveDateTimeInput}
                onChange={(e) => setLeaveDateTimeInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono tabular-nums focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <CalendarClock size={14} className="text-emerald-500" />
                Expected Return Date & Time *
              </label>
              <input
                type="datetime-local"
                value={returnDateTimeInput}
                onChange={(e) => setReturnDateTimeInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono tabular-nums focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Receipt Contact Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Phone size={12} className="text-blue-500" />
                Student Mobile *
              </label>
              <input
                type="text"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <IdCard size={12} className="text-emerald-500" />
                Guardian Name *
              </label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Phone size={12} className="text-emerald-500" />
                Guardian Phone *
              </label>
              <input
                type="text"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Campus Curfew Policy: Standard return required before <strong>{curfewTime}</strong>.
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition cursor-pointer ${
                priority === 'emergency'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              <Send size={14} />
              <span>
                {priority === 'emergency'
                  ? 'Submit Urgent SOS & Generate Receipt'
                  : 'Submit Request & Generate Receipt'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
