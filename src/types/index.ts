export type UserRole = 'student' | 'staff' | 'guard' | 'admin'

export type PassStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'expired' | 'cancelled'

export type GateEventState = 'no_exit' | 'exited' | 'returned'

export type PassCategory = 'medical_sos' | 'academic' | 'official' | 'personal'

export type PassPriority = 'normal' | 'emergency'

export type ResidenceType = 'Hostel Resident' | 'Day Scholar'

export type GateLocation =
  | 'Main Gate 1 (Central Plaza)'
  | 'Hostel Gate 2 (North Wing)'
  | 'Workshop Gate 3 (MIDC Access)'

export type DutyShift = 'Morning Shift (06:00 - 14:00)' | 'Afternoon Shift (14:00 - 22:00)' | 'Night Shift (22:00 - 06:00)'

export interface UserProfile {
  id: string
  studentId?: string // Unique College Student ID e.g. STU-2026-042
  name: string
  email: string
  passwordPin?: string
  role: UserRole
  avatarUrl?: string
  department?: string
  rollNo?: string // Unique Roll Number e.g. CO-2024-042
  staffId?: string // Unique Staff or Guard ID
  designation?: string
  phone?: string
  guardianName?: string
  guardianPhone?: string
  residenceType?: ResidenceType
  hostelBlock?: string
  bloodGroup?: string
  year?: string
  semester?: string
  assignedGate?: GateLocation
  dutyShift?: DutyShift
  registeredAt?: string
}

export interface GatePassRequest {
  id: string
  passNumber: string
  receiptNumber: string // Official Receipt Serial e.g. RCPT-2026-8410
  studentId: string // Database user id
  collegeStudentId?: string // Unique Student ID e.g. STU-2026-042
  studentName: string
  studentRollNo: string
  studentEmail?: string
  studentPhone?: string
  guardianName?: string
  guardianPhone?: string
  residenceType?: ResidenceType
  hostelBlock?: string
  bloodGroup?: string
  studentAvatar?: string
  department: string
  year: string
  category?: PassCategory
  priority?: PassPriority
  reason: string
  destination: string
  leaveTime: string
  leaveDateTimeISO?: string
  expectedReturnTime: string
  expectedReturnDateTimeISO?: string
  actualExitTime?: string
  actualExitTimeISO?: string
  actualReturnTime?: string
  actualReturnTimeISO?: string
  status: PassStatus
  gateState: GateEventState
  isOverdue?: boolean
  overdueMinutes?: number
  guardianNotified?: boolean
  guardianNotifiedAt?: string
  attachmentLabel?: string
  decisionNote?: string
  decidedBy?: string
  decidedByName?: string
  decidedByStaffId?: string
  decidedAt?: string
  decidedAtISO?: string
  createdAt: string
  createdAtISO?: string
  qrToken?: string
  qrExpiresAt?: string
  exitGate?: string
  exitGuardName?: string
  returnGate?: string
  returnGuardName?: string
  guardRemarks?: string
}

export interface GateEvent {
  id: string
  requestId: string
  passNumber: string
  receiptNumber?: string
  studentId?: string
  collegeStudentId?: string
  studentName: string
  studentRollNo: string
  department?: string
  eventType: 'exit' | 'return'
  timestamp: string
  timestampISO?: string
  hourOfDay?: number
  guardId: string
  guardName: string
  gateLocation: string
  physicalIdConfirmed: boolean
  scanMethod?: 'camera_qr' | 'image_qr' | 'software_direct' | 'manual_token'
  isLateReturn?: boolean
  lateMinutes?: number
  note?: string
}

export interface AuditEvent {
  id: string
  timestamp: string
  timestampISO?: string
  entityType: 'gate_pass' | 'gate_event' | 'user' | 'system' | 'policy'
  entityId: string
  action:
    | 'create_request'
    | 'approve_request'
    | 'reject_request'
    | 'record_exit'
    | 'record_return'
    | 'cancel_request'
    | 'revoke_pass'
    | 'flag_overdue'
    | 'notify_guardian'
    | 'update_policy'
    | 'register_user'
    | 'user_login'
  actorId: string
  actorName: string
  actorRole: UserRole
  prevHash?: string
  hash?: string
  metadata: Record<string, string | number | boolean | null>
}

export interface CampusPolicyConfig {
  allowCrossDepartmentApproval: boolean
  defaultExpiryHours: number
  campusCurfewTime: string
  requireGuardianPhoneForSOS: boolean
  strictFailClosedMode: boolean
  autoFlagOverdueMinutes: number
}
