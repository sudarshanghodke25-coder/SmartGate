export type UserRole = 'student' | 'staff' | 'guard' | 'admin'

export type PassStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'expired' | 'cancelled'

export type GateEventState = 'no_exit' | 'exited' | 'returned'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  department?: string
  rollNo?: string
  staffId?: string
  phone?: string
}

export interface GatePassRequest {
  id: string
  passNumber: string
  studentId: string
  studentName: string
  studentRollNo: string
  studentAvatar?: string
  department: string
  year: string
  reason: string
  destination: string
  leaveTime: string
  expectedReturnTime: string
  actualExitTime?: string
  actualReturnTime?: string
  status: PassStatus
  gateState: GateEventState
  decisionNote?: string
  decidedBy?: string
  decidedByName?: string
  decidedAt?: string
  createdAt: string
  qrToken?: string
  qrExpiresAt?: string
}

export interface GateEvent {
  id: string
  requestId: string
  passNumber: string
  studentName: string
  studentRollNo: string
  eventType: 'exit' | 'return'
  timestamp: string
  guardId: string
  guardName: string
  gateLocation: string
  physicalIdConfirmed: boolean
  note?: string
}

export interface AuditEvent {
  id: string
  timestamp: string
  entityType: 'gate_pass' | 'gate_event' | 'user' | 'system'
  entityId: string
  action:
    | 'create_request'
    | 'approve_request'
    | 'reject_request'
    | 'record_exit'
    | 'record_return'
    | 'cancel_request'
    | 'revoke_pass'
  actorId: string
  actorName: string
  actorRole: UserRole
  metadata: Record<string, string | number | boolean | null>
}
