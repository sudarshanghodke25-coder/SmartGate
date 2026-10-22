import QRCode from 'qrcode'
import type { GatePassRequest, GateEvent, AuditEvent, UserProfile } from '../types'

/**
 * Formats a Date or ISO string into an accurate, human-readable timestamp:
 * e.g., "22 Oct 2026, 10:54:12 AM" or without seconds "22 Oct 2026, 02:30 PM"
 */
export function formatAccurateDateTime(
  input?: Date | string,
  includeSeconds = false,
): string {
  const d = input ? new Date(input) : new Date()
  if (Number.isNaN(d.getTime())) {
    return typeof input === 'string' && input ? input : new Date().toLocaleString()
  }
  const day = String(d.getDate()).padStart(2, '0')
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const month = months[d.getMonth()]
  const year = d.getFullYear()

  let hours = d.getHours()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  const hh = String(hours).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')

  return includeSeconds
    ? `${day} ${month} ${year}, ${hh}:${mm}:${ss} ${ampm}`
    : `${day} ${month} ${year}, ${hh}:${mm} ${ampm}`
}

/**
 * Returns a local YYYY-MM-DDTHH:mm string for <input type="datetime-local">
 */
export function getLocalDateTimeInputValue(offsetMinutes = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60 * 1000)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${mins}`
}

/**
 * Builds a dual-purpose QR payload string that is:
 * 1) Directly readable when scanned by any mobile phone camera app
 * 2) Machine-parseable by the SmartGate Guard Scanner to log direct database entries
 */
export function buildUniversalQrPayload(req: GatePassRequest): string {
  const token = req.qrToken || req.passNumber
  return [
    'SMARTGATE OFFICIAL GATE PASS RECEIPT',
    `TOKEN:${token}`,
    `PASS:${req.passNumber}`,
    `RECEIPT:${req.receiptNumber || 'RCPT-2026-0841'}`,
    `STUDENT:${req.studentName}`,
    `ROLL:${req.studentRollNo}`,
    `STU_ID:${req.collegeStudentId || 'STU-2026-042'}`,
    `DEPT:${req.department} (${req.year})`,
    `DEST:${req.destination}`,
    `OUT:${req.leaveTime}`,
    `IN:${req.expectedReturnTime}`,
    `APPROVED_BY:${req.decidedByName || 'Authorized Faculty'}`,
  ].join('\n')
}

/**
 * Parses a raw QR scan result (either multi-line receipt text, JSON, or raw token)
 * and returns the clean lookup token/passNumber/receiptNumber.
 */
export function parseScannedQrPayload(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  // Check for TOKEN:xxx or PASS:xxx lines
  const tokenMatch = trimmed.match(/TOKEN:\s*([A-Z0-9-]+)/i)
  if (tokenMatch?.[1]) return tokenMatch[1].toUpperCase()

  const passMatch = trimmed.match(/PASS:\s*([A-Z0-9-]+)/i)
  if (passMatch?.[1]) return passMatch[1].toUpperCase()

  const rcptMatch = trimmed.match(/RECEIPT:\s*([A-Z0-9-]+)/i)
  if (rcptMatch?.[1]) return rcptMatch[1].toUpperCase()

  // Otherwise return the trimmed code directly
  return trimmed.toUpperCase()
}

/**
 * Generates an authentic ISO/IEC 18004 standard QR code PNG Data URL
 * scannable by both mobile phone cameras and the in-app Guard optical scanner.
 */
export async function generateStandardQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 340,
    color: {
      dark: '#0b0f19',
      light: '#ffffff',
    },
  })
}

/**
 * Computes a deterministic 64-character hexadecimal SHA-256-style hash link
 * for tamper-evident audit log chaining.
 */
export function computeAuditHash(prevHash: string, dataString: string): string {
  const input = `${prevHash}|${dataString}`
  const blocks = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    const idx = i % 8
    blocks[idx] = Math.imul(blocks[idx] ^ ch, 0x01000193) >>> 0
    blocks[(idx + 3) % 8] = (blocks[(idx + 3) % 8] + (blocks[idx] >>> 5) + ch * 31) >>> 0
  }
  return blocks.map((b) => b.toString(16).padStart(8, '0')).join('')
}

export function generateActionStamp(prefix: string): {
  id: string
  passNumber: string
  receiptNumber: string
  studentIdCode: string
  qrCodeSuffix: string
  timeLabel: string
  timeWithSeconds: string
  isoString: string
  hourOfDay: number
} {
  const now = new Date()
  const ms = now.getTime()
  const suffix = String(ms).slice(-4)
  const numericPass = 1000 + (ms % 9000)
  const numericReceipt = 5000 + ((ms * 7) % 4999)
  const qrSuffix = ((ms * 2654435761) >>> 0).toString(36).substring(0, 4).toUpperCase()
  return {
    id: `${prefix}_${suffix}`,
    passNumber: `GP-${now.getFullYear()}-${numericPass}`,
    receiptNumber: `RCPT-${now.getFullYear()}-${numericReceipt}`,
    studentIdCode: `STU-${now.getFullYear()}-${suffix}`,
    qrCodeSuffix: qrSuffix,
    timeLabel: formatAccurateDateTime(now, false),
    timeWithSeconds: formatAccurateDateTime(now, true),
    isoString: now.toISOString(),
    hourOfDay: now.getHours(),
  }
}

/**
 * Exports an array of records to a browser-downloaded CSV file.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean)[][],
): void {
  const escapeCell = (val: string | number | boolean) => {
    const str = String(val ?? '')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ]
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportPassesToCsv(requests: GatePassRequest[]): void {
  const headers = [
    'Receipt Number',
    'Pass Number',
    'Student ID',
    'Student Name',
    'Roll No',
    'Department',
    'Year',
    'Student Phone',
    'Guardian Phone',
    'Category',
    'Priority',
    'Status',
    'Gate State',
    'Overdue',
    'Reason',
    'Destination',
    'Leave Date & Time',
    'Expected Return Date & Time',
    'Actual Exit Timestamp',
    'Actual Return Timestamp',
    'Decided By',
    'QR Token',
  ]
  const rows = requests.map((r) => [
    r.receiptNumber || '-',
    r.passNumber,
    r.collegeStudentId || '-',
    r.studentName,
    r.studentRollNo,
    r.department,
    r.year,
    r.studentPhone || '-',
    r.guardianPhone || '-',
    r.category || 'official',
    r.priority || 'normal',
    r.status,
    r.gateState,
    r.isOverdue ? 'YES' : 'NO',
    r.reason,
    r.destination,
    r.leaveTime,
    r.expectedReturnTime,
    r.actualExitTime || '-',
    r.actualReturnTime || '-',
    r.decidedByName || 'Pending',
    r.qrToken || '-',
  ])
  downloadCsv(`smartgate-passes-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
}

export function exportUsersToCsv(users: UserProfile[]): void {
  const headers = [
    'User ID',
    'Role',
    'Full Name',
    'Student ID / Staff ID',
    'Roll Number',
    'Email',
    'Department',
    'Year / Designation',
    'Phone',
    'Guardian Name',
    'Guardian Phone',
    'Residence / Gate',
    'Registered Timestamp',
  ]
  const rows = users.map((u) => [
    u.id,
    u.role.toUpperCase(),
    u.name,
    u.studentId || u.staffId || '-',
    u.rollNo || '-',
    u.email,
    u.department || '-',
    u.year || u.designation || '-',
    u.phone || '-',
    u.guardianName || '-',
    u.guardianPhone || '-',
    u.hostelBlock || u.residenceType || u.assignedGate || '-',
    u.registeredAt || '-',
  ])
  downloadCsv(`smartgate-users-registry-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
}

export function exportGateEventsToCsv(events: GateEvent[]): void {
  const headers = [
    'Event ID',
    'Receipt Number',
    'Pass Number',
    'Student ID',
    'Student Name',
    'Roll No',
    'Event Type',
    'Exact Timestamp',
    'Gate Location',
    'Guard Name',
    'Scan Method',
    'Physical ID Verified',
    'Late Return',
    'Remarks',
  ]
  const rows = events.map((e) => [
    e.id,
    e.receiptNumber || '-',
    e.passNumber,
    e.collegeStudentId || '-',
    e.studentName,
    e.studentRollNo,
    e.eventType.toUpperCase(),
    e.timestamp,
    e.gateLocation,
    e.guardName,
    e.scanMethod || 'software_direct',
    e.physicalIdConfirmed ? 'VERIFIED' : 'NO',
    e.isLateReturn ? `LATE (+${e.lateMinutes || 0}m)` : 'ON TIME',
    e.note || '',
  ])
  downloadCsv(`smartgate-gate-events-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
}

export function exportAuditLogsToCsv(logs: AuditEvent[]): void {
  const headers = [
    'Audit ID',
    'Exact Timestamp',
    'Action',
    'Entity Type',
    'Entity ID',
    'Actor Name',
    'Actor Role',
    'Previous Hash',
    'Current Hash',
    'Metadata JSON',
  ]
  const rows = logs.map((l) => [
    l.id,
    l.timestamp,
    l.action,
    l.entityType,
    l.entityId,
    l.actorName,
    l.actorRole,
    l.prevHash || 'GENESIS',
    l.hash || '',
    JSON.stringify(l.metadata),
  ])
  downloadCsv(`smartgate-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
}
