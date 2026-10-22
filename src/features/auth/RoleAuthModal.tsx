import React, { useState } from 'react'
import {
  GraduationCap,
  Briefcase,
  Shield,
  Settings,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  X,
  KeyRound,
  Building2,
  Phone,
  UserCheck,
  IdCard,
  Clock,
  MapPin,
} from 'lucide-react'
import type {
  UserRole,
  UserProfile,
  ResidenceType,
  GateLocation,
  DutyShift,
} from '../../types'
import { generateActionStamp } from '../../lib/qrAndExport'

interface RoleAuthModalProps {
  initialRole: UserRole
  users: UserProfile[]
  currentUser: UserProfile
  onSelectUser: (user: UserProfile) => void
  onRegisterUser: (newUser: UserProfile) => void
  onClose?: () => void
  isFullPage?: boolean
}

const DEPARTMENTS = [
  'Computer Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Electronics & Telecom',
]

const GATE_LOCATIONS: GateLocation[] = [
  'Main Gate 1 (Central Plaza)',
  'Hostel Gate 2 (North Wing)',
  'Workshop Gate 3 (MIDC Access)',
]

const DUTY_SHIFTS: DutyShift[] = [
  'Morning Shift (06:00 - 14:00)',
  'Afternoon Shift (14:00 - 22:00)',
  'Night Shift (22:00 - 06:00)',
]

export const RoleAuthModal: React.FC<RoleAuthModalProps> = ({
  initialRole,
  users,
  currentUser,
  onSelectUser,
  onRegisterUser,
  onClose,
  isFullPage = false,
}) => {
  const [activeRoleTab, setActiveRoleTab] = useState<UserRole>(initialRole)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPin, setLoginPin] = useState('')
  const [guardGateChoice, setGuardGateChoice] = useState<GateLocation>(
    'Main Gate 1 (Central Plaza)',
  )
  const [guardShiftChoice, setGuardShiftChoice] = useState<DutyShift>(
    'Morning Shift (06:00 - 14:00)',
  )

  // Registration state (Student / Staff / Guard)
  const [fullName, setFullName] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [customStudentId, setCustomStudentId] = useState('')
  const [staffIdInput, setStaffIdInput] = useState('')
  const [email, setEmail] = useState('')
  const [passwordPin, setPasswordPin] = useState('1234')
  const [department, setDepartment] = useState('Computer Engineering')
  const [year, setYear] = useState('Year 3 (Diploma)')
  const [semester, setSemester] = useState('Semester 5')
  const [designation, setDesignation] = useState('Assistant Professor')
  const [phone, setPhone] = useState('+91 ')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('+91 ')
  const [residenceType, setResidenceType] = useState<ResidenceType>('Hostel Resident')
  const [hostelBlock, setHostelBlock] = useState('Hostel Block A - Room 101')
  const [bloodGroup, setBloodGroup] = useState('O+')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [duplicateUserMatch, setDuplicateUserMatch] = useState<UserProfile | null>(null)

  const roleUsers = users.filter((u) => u.role === activeRoleTab)

  const handleRoleTabChange = (role: UserRole) => {
    setActiveRoleTab(role)
    setErrorMsg(null)
    setDuplicateUserMatch(null)
    if (role === 'admin') {
      setAuthMode('login')
    }
  }

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    const q = loginIdentifier.trim().toLowerCase()

    if (!q) {
      setErrorMsg('Please enter your ID, Roll Number, or Email to sign in.')
      return
    }

    const found = roleUsers.find(
      (u) =>
        u.rollNo?.toLowerCase() === q ||
        u.studentId?.toLowerCase() === q ||
        u.staffId?.toLowerCase() === q ||
        u.email.toLowerCase() === q ||
        u.name.toLowerCase() === q,
    )

    if (!found) {
      setErrorMsg(
        `No registered ${activeRoleTab.toUpperCase()} account matches "${loginIdentifier}". Check your ID or register a new profile.`,
      )
      return
    }

    if (loginPin.trim() && found.passwordPin && loginPin.trim() !== found.passwordPin) {
      setErrorMsg('Invalid Security PIN / Password. (Default demo PINs: 1234 or role123)')
      return
    }

    // If guard, update their active gate and shift selection
    const updatedUser: UserProfile =
      activeRoleTab === 'guard'
        ? {
            ...found,
            assignedGate: guardGateChoice,
            dutyShift: guardShiftChoice,
          }
        : found

    onSelectUser(updatedUser)
    if (onClose) onClose()
  }

  // Handle Registration Submit with strict duplicate check
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setDuplicateUserMatch(null)

    const cleanName = fullName.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanRoll = rollNo.trim().toUpperCase()
    const cleanStaffId = staffIdInput.trim().toUpperCase()

    if (cleanName.length < 3) {
      setErrorMsg('Please enter a valid full name (minimum 3 characters).')
      return
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please provide a valid institutional or personal email address.')
      return
    }

    if (activeRoleTab === 'student') {
      if (cleanRoll.length < 4) {
        setErrorMsg('Please enter a valid Student Roll Number (e.g., CO-2026-055).')
        return
      }
      if (phone.trim().length < 10) {
        setErrorMsg('Please enter a valid 10-digit student mobile phone number.')
        return
      }
      if (guardianName.trim().length < 3 || guardianPhone.trim().length < 10) {
        setErrorMsg(
          'Parent / Guardian full name and emergency contact number are mandatory for Gate Pass Receipt generation.',
        )
        return
      }
    } else {
      if (cleanStaffId.length < 4) {
        setErrorMsg(
          `Please enter a valid ${activeRoleTab === 'staff' ? 'Faculty Staff ID (e.g. FAC-CE-112)' : 'Guard Badge ID (e.g. SEC-GATE-04)'}.`,
        )
        return
      }
    }

    // STRICT ANTI-DUPLICATE CHECK across all users
    const stamp = generateActionStamp('usr')
    const generatedStuId = customStudentId.trim().toUpperCase() || stamp.studentIdCode

    const existingDuplicate = users.find((u) => {
      if (u.email.toLowerCase() === cleanEmail) return true
      if (activeRoleTab === 'student') {
        if (u.rollNo && u.rollNo.toUpperCase() === cleanRoll) return true
        if (u.studentId && u.studentId.toUpperCase() === generatedStuId) return true
      } else {
        if (u.staffId && u.staffId.toUpperCase() === cleanStaffId) return true
      }
      return false
    })

    if (existingDuplicate) {
      setDuplicateUserMatch(existingDuplicate)
      setErrorMsg(
        `DUPLICATE REGISTRATION BLOCKED: An account with Roll No / ID "${
          existingDuplicate.rollNo || existingDuplicate.studentId || existingDuplicate.staffId
        }" or Email "${existingDuplicate.email}" is already registered to ${existingDuplicate.name}. Repeated registrations are not permitted.`,
      )
      return
    }

    const newUser: UserProfile =
      activeRoleTab === 'student'
        ? {
            id: stamp.id,
            studentId: generatedStuId,
            name: cleanName,
            email: cleanEmail,
            passwordPin: passwordPin.trim() || '1234',
            role: 'student',
            department,
            rollNo: cleanRoll,
            phone: phone.trim(),
            guardianName: guardianName.trim(),
            guardianPhone: guardianPhone.trim(),
            residenceType,
            hostelBlock:
              residenceType === 'Hostel Resident' ? hostelBlock.trim() : 'Day Scholar',
            bloodGroup,
            year,
            semester,
            registeredAt: stamp.timeWithSeconds,
          }
        : activeRoleTab === 'staff'
          ? {
              id: stamp.id,
              name: cleanName,
              email: cleanEmail,
              passwordPin: passwordPin.trim() || 'staff123',
              role: 'staff',
              department,
              staffId: cleanStaffId,
              designation: designation.trim() || 'Faculty Approver',
              phone: phone.trim(),
              registeredAt: stamp.timeWithSeconds,
            }
          : {
              id: stamp.id,
              name: cleanName,
              email: cleanEmail,
              passwordPin: passwordPin.trim() || 'guard123',
              role: 'guard',
              staffId: cleanStaffId,
              designation: 'Gate Security Officer',
              assignedGate: guardGateChoice,
              dutyShift: guardShiftChoice,
              phone: phone.trim(),
              registeredAt: stamp.timeWithSeconds,
            }

    onRegisterUser(newUser)
    if (onClose) onClose()
  }

  const roleMeta = {
    student: {
      title: 'Student Gate-Pass Portal',
      subtitle:
        'Sign in with your Roll Number or register your student profile to generate official Gate Pass Receipts.',
      badge: 'Student Module',
      accentBg: 'bg-blue-600',
      accentText: 'text-blue-600 dark:text-blue-400',
      borderAccent: 'border-blue-500',
    },
    staff: {
      title: 'Faculty & HOD Approval Portal',
      subtitle:
        'Departmental staff authentication for reviewing student gate pass requests and issuing QR authorizations.',
      badge: 'Staff Module',
      accentBg: 'bg-indigo-600',
      accentText: 'text-indigo-600 dark:text-indigo-400',
      borderAccent: 'border-indigo-500',
    },
    guard: {
      title: 'Campus Gate Security Terminal',
      subtitle:
        'Guard checkpoint login for optical QR scanning, physical ID verification, and direct database entry logging.',
      badge: 'Guard Module',
      accentBg: 'bg-emerald-600',
      accentText: 'text-emerald-600 dark:text-emerald-400',
      borderAccent: 'border-emerald-500',
    },
    admin: {
      title: 'Central Administrator Command',
      subtitle:
        'Master institutional console for student database registry, curfew monitoring, and policy control.',
      badge: 'Admin Module',
      accentBg: 'bg-purple-600',
      accentText: 'text-purple-600 dark:text-purple-400',
      borderAccent: 'border-purple-500',
    },
  }[activeRoleTab]

  const containerContent = (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-full ${
        isFullPage ? 'max-w-5xl mx-auto my-6' : 'max-w-4xl max-h-[92vh]'
      } bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
    >
      {/* Top Role Selector Tabs */}
      <div className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(
            [
              { id: 'student', label: 'Student Login', icon: GraduationCap },
              { id: 'staff', label: 'Staff Module', icon: Briefcase },
              { id: 'guard', label: 'Guard Login', icon: Shield },
              { id: 'admin', label: 'Admin Module', icon: Settings },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon
            const isActive = activeRoleTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleRoleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? `${roleMeta.accentBg} text-white shadow-sm`
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close portal switcher"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
        {/* Left Column: Login or Registration Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {roleMeta.badge}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {roleMeta.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {roleMeta.subtitle}
            </p>
          </div>

          {/* Toggle Sign In vs New Registration (for Student, Staff, Guard) */}
          {activeRoleTab !== 'admin' && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login')
                  setErrorMsg(null)
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LogIn size={14} />
                <span>Existing {activeRoleTab} Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register')
                  setErrorMsg(null)
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus size={14} />
                <span>New {activeRoleTab} Registration</span>
              </button>
            </div>
          )}

          {/* Error & Duplicate Alert Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMsg}</span>
              </div>
              {duplicateUserMatch && (
                <div className="pt-1 flex items-center justify-between gap-2 border-t border-rose-200/60 dark:border-rose-800/60">
                  <span className="text-slate-600 dark:text-slate-300 font-mono">
                    Existing: {duplicateUserMatch.name} ({duplicateUserMatch.rollNo || duplicateUserMatch.staffId})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectUser(duplicateUserMatch)
                      if (onClose) onClose()
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition cursor-pointer whitespace-nowrap"
                  >
                    Sign In as {duplicateUserMatch.name} &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activeRoleTab === 'student'
                    ? 'Student Roll Number, Student ID, or College Email *'
                    : activeRoleTab === 'staff'
                      ? 'Faculty Staff ID or College Email *'
                      : activeRoleTab === 'guard'
                        ? 'Security Guard Badge ID *'
                        : 'Administrator Credential ID *'}
                </label>
                <div className="relative">
                  <IdCard
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={
                      activeRoleTab === 'student'
                        ? 'e.g. CO-2024-042 or STU-2026-1042'
                        : activeRoleTab === 'staff'
                          ? 'e.g. FAC-CE-108'
                          : activeRoleTab === 'guard'
                            ? 'e.g. SEC-GATE-01'
                            : 'e.g. ADM-DIR-001'
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Security PIN / Password
                </label>
                <div className="relative">
                  <KeyRound
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="password"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="Enter PIN (or leave blank for instant demo sign-in)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Guard-specific Checkpoint & Shift selection on Login */}
              {activeRoleTab === 'guard' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <MapPin size={13} className="text-emerald-600 dark:text-emerald-400" />
                      Assigned Gate Checkpoint
                    </label>
                    <select
                      value={guardGateChoice}
                      onChange={(e) => setGuardGateChoice(e.target.value as GateLocation)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    >
                      {GATE_LOCATIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Clock size={13} className="text-emerald-600 dark:text-emerald-400" />
                      Active Duty Shift
                    </label>
                    <select
                      value={guardShiftChoice}
                      onChange={(e) => setGuardShiftChoice(e.target.value as DutyShift)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    >
                      {DUTY_SHIFTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-3 px-5 rounded-xl ${roleMeta.accentBg} hover:opacity-95 text-white font-bold text-sm shadow-lg transition cursor-pointer flex items-center justify-center gap-2`}
              >
                <LogIn size={16} />
                <span>Sign In to {roleMeta.badge}</span>
              </button>
            </form>
          ) : (
            /* NEW USER REGISTRATION FORM (WITH DUPLICATE PREVENTION) */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-800 dark:text-blue-200">
                <span className="font-bold">Official Pass Receipt Data Capture: </span>
                All fields below are validated for uniqueness (no duplicate Roll Numbers or IDs) and stored directly in the campus database to generate scannable Gate Pass Receipts.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Nikhil Deshpande"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                {activeRoleTab === 'student' ? (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Unique Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                      placeholder="e.g. CO-2026-088"
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono uppercase"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Unique {activeRoleTab === 'staff' ? 'Faculty Staff ID' : 'Guard Badge ID'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={staffIdInput}
                      onChange={(e) => setStaffIdInput(e.target.value.toUpperCase())}
                      placeholder={activeRoleTab === 'staff' ? 'FAC-CE-115' : 'SEC-GATE-05'}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono uppercase"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    College Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@diploma.college.edu"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98201 54321"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              {activeRoleTab === 'student' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Department *
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Academic Year *
                      </label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="Year 1 (Diploma)">Year 1 (Diploma)</option>
                        <option value="Year 2 (Diploma)">Year 2 (Diploma)</option>
                        <option value="Year 3 (Diploma)">Year 3 (Diploma)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Student PRN / ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={customStudentId}
                        onChange={(e) => setCustomStudentId(e.target.value.toUpperCase())}
                        placeholder="Auto: STU-2026-XXXX"
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white uppercase"
                      />
                    </div>
                  </div>

                  {/* Guardian & Residence Details for Pass Receipt */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Parent / Guardian Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        placeholder="e.g. Prakash Deshpande"
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Guardian Emergency Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        placeholder="+91 98201 00000"
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Residence Type
                      </label>
                      <select
                        value={residenceType}
                        onChange={(e) => setResidenceType(e.target.value as ResidenceType)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="Hostel Resident">Hostel Resident</option>
                        <option value="Day Scholar">Day Scholar</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Hostel Block / Bus Route
                      </label>
                      <input
                        type="text"
                        value={hostelBlock}
                        onChange={(e) => setHostelBlock(e.target.value)}
                        placeholder="Hostel Block A - Room 101"
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Blood Group & Sem
                      </label>
                      <div className="flex gap-1.5">
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-1/2 px-2 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                        >
                          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </select>
                        <select
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="w-1/2 px-2 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                        >
                          {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeRoleTab === 'staff' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Department *
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Academic Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="HOD / Senior Faculty"
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Set Security PIN *
                  </label>
                  <input
                    type="text"
                    required
                    value={passwordPin}
                    onChange={(e) => setPasswordPin(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 px-5 rounded-xl ${roleMeta.accentBg} hover:opacity-95 text-white font-bold text-sm shadow-lg transition cursor-pointer flex items-center justify-center gap-2`}
              >
                <UserPlus size={16} />
                <span>Complete {activeRoleTab.toUpperCase()} Registration & Sign In</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Registered Directory & 1-Click Quick Sign-In */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/80 dark:bg-slate-950/60 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck size={16} className={roleMeta.accentText} />
              <span>Registered {activeRoleTab.toUpperCase()} Accounts ({roleUsers.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any verified campus account below for instant 1-click sign-in:
            </p>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {roleUsers.map((u) => {
              const isCurrent = u.id === currentUser.id
              return (
                <div
                  key={u.id}
                  onClick={() => {
                    onSelectUser(u)
                    if (onClose) onClose()
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isCurrent
                      ? `${roleMeta.borderAccent} bg-blue-50/50 dark:bg-slate-900`
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {u.name}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={11} /> Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                        {u.rollNo ? `Roll: ${u.rollNo}` : `ID: ${u.staffId}`}
                        {u.studentId ? ` · ${u.studentId}` : ''}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      Sign In &rarr;
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {u.department && (
                      <span className="flex items-center gap-1">
                        <Building2 size={11} />
                        {u.department}
                      </span>
                    )}
                    {u.guardianPhone && (
                      <span className="flex items-center gap-1 font-mono tabular-nums">
                        <Phone size={11} />
                        Guardian: {u.guardianPhone}
                      </span>
                    )}
                    {u.assignedGate && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {u.assignedGate}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  if (isFullPage) {
    return containerContent
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      {containerContent}
    </div>
  )
}
