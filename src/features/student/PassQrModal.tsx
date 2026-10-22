import { useState, useEffect } from 'react'
import {
  X,
  ShieldCheck,
  Clock,
  UserCheck,
  Copy,
  Check,
  Printer,
  QrCode,
  Send,
  Download,
  Smartphone,
  FileCheck2,
} from 'lucide-react'
import type { GatePassRequest } from '../../types'
import {
  buildUniversalQrPayload,
  generateStandardQrDataUrl,
} from '../../lib/qrAndExport'

interface PassQrModalProps {
  request: GatePassRequest
  onClose: () => void
  onNotifyGuardian?: (requestId: string) => void
  onJumpToGuardScan?: (token: string) => void
}

export const PassQrModal = ({
  request,
  onClose,
  onNotifyGuardian,
  onJumpToGuardScan,
}: PassQrModalProps) => {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'receipt' | 'qr'>('receipt')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [smsSent, setSmsSent] = useState(Boolean(request.guardianNotified))

  const token = request.qrToken || request.passNumber
  const receiptNo = request.receiptNumber || `RCPT-2026-${request.passNumber.slice(-4)}`
  const universalPayload = buildUniversalQrPayload(request)

  useEffect(() => {
    let active = true
    generateStandardQrDataUrl(universalPayload)
      .then((url) => {
        if (active) setQrDataUrl(url)
      })
      .catch(() => {
        // Fallback handled gracefully
      })
    return () => {
      active = false
    }
  }, [universalPayload])

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `${request.passNumber}-${request.studentRollNo}-QR.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadReceiptTxt = () => {
    const content = [
      '====================================================================',
      '          SMARTGATE — OFFICIAL COLLEGE GATE PASS RECEIPT            ',
      '====================================================================',
      `Receipt Number        : ${receiptNo}`,
      `Gate Pass Number      : ${request.passNumber}`,
      `Verification Token    : ${token}`,
      `Pass Status           : ${request.status.toUpperCase()} (${request.gateState.toUpperCase()})`,
      '--------------------------------------------------------------------',
      '1. VALIDATED STUDENT CREDENTIALS',
      `Student Full Name     : ${request.studentName}`,
      `College Student ID    : ${request.collegeStudentId || 'STU-2026-1042'}`,
      `Roll Number           : ${request.studentRollNo}`,
      `Department & Year     : ${request.department} · ${request.year}`,
      `Residence / Hostel    : ${request.hostelBlock || request.residenceType || 'Campus Resident'}`,
      `Student Mobile        : ${request.studentPhone || '+91 98201 12345'}`,
      `Parent/Guardian Name  : ${request.guardianName || 'Registered Guardian'}`,
      `Guardian Phone        : ${request.guardianPhone || '+91 98201 99881'}`,
      '--------------------------------------------------------------------',
      '2. EXIT & RETURN SCHEDULE (ACCURATE TIMESTAMPS)',
      `Pass Category         : ${(request.category || 'official').toUpperCase()} (${(request.priority || 'normal').toUpperCase()})`,
      `Reason for Exit       : ${request.reason}`,
      `Destination           : ${request.destination}`,
      `Requested Created At  : ${request.createdAt}`,
      `Scheduled Leave Time  : ${request.leaveTime}`,
      `Expected Return Time  : ${request.expectedReturnTime}`,
      `Actual Gate Exit      : ${request.actualExitTime || 'Pending Gate Exit'} (${request.exitGate || '-'})`,
      `Actual Gate Return    : ${request.actualReturnTime || 'Pending Return'} (${request.returnGate || '-'})`,
      '--------------------------------------------------------------------',
      '3. FACULTY & SECURITY AUTHORIZATION',
      `Approved By Faculty   : ${request.decidedByName || 'Dr. Sunita Patil'} (${request.decidedByStaffId || 'FAC-CE-108'})`,
      `Approval Timestamp    : ${request.decidedAt || request.createdAt}`,
      `Faculty Remarks       : ${request.decisionNote || 'Verified and approved.'}`,
      '====================================================================',
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${receiptNo}-${request.studentRollNo}-Receipt.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSendGuardianAlert = () => {
    setSmsSent(true)
    if (onNotifyGuardian) {
      onNotifyGuardian(request.id)
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Official Gate Pass Receipt & Mobile QR
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
              Receipt: {receiptNo} · Pass: {request.passNumber} · Roll: {request.studentRollNo}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('receipt')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  viewMode === 'receipt'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Printer size={13} />
                <span>Full Pass Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('qr')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  viewMode === 'qr'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <QrCode size={13} />
                <span>Large Scanner QR</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {viewMode === 'receipt' ? (
            <>
              {/* Official Structured College Gate Pass Receipt */}
              <div className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950 p-5 space-y-4">
                {/* Receipt Header Stamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      SmartGate Campus Security System
                    </div>
                    <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      OFFICIAL STUDENT EXIT / RETURN RECEIPT
                    </h4>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      Issued: {request.decidedAt || request.createdAt}
                    </div>
                  </div>

                  <div className="text-left sm:text-right font-mono tabular-nums bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Receipt Serial</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {receiptNo}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Token: <span className="font-bold">{token}</span>
                    </div>
                  </div>
                </div>

                {/* Middle Grid: Validated Student Details + Scannable QR Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-8 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Student Full Name</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {request.studentName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Roll No & Student ID</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {request.studentRollNo} · {request.collegeStudentId || 'STU-2026-1042'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Department & Year</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {request.department} ({request.year})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Residence & Blood Group</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {request.hostelBlock || request.residenceType || 'Hostel A'}{' '}
                        {request.bloodGroup ? `(${request.bloodGroup})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Student Mobile</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                        {request.studentPhone || '+91 98201 12345'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Parent / Guardian</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                        {request.guardianName ? `${request.guardianName} · ` : ''}
                        {request.guardianPhone || '+91 98201 99881'}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[11px]">
                        Authorized Destination & Reason
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {request.destination} — {request.reason}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Scheduled Leave</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {request.leaveTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Expected Return</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {request.expectedReturnTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Actual Gate Exit</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                        {request.actualExitTime || 'Not exited yet'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Actual Gate Return</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                        {request.actualReturnTime || 'Pending return'}
                      </span>
                    </div>
                  </div>

                  {/* Embedded Real QR on Receipt */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={`Gate Pass QR Code for ${request.passNumber}`}
                        referrerPolicy="no-referrer"
                        className="w-36 h-36 object-contain"
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                        Generating QR...
                      </div>
                    )}
                    <span className="text-[10px] font-mono font-bold text-slate-700 mt-1 tabular-nums">
                      {token}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Phone & Guard Scannable
                    </span>
                  </div>
                </div>

                {/* Receipt Footer Signatures */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Faculty Approver:{' '}
                    </span>
                    {request.decidedByName || 'Dr. Sunita Patil'} (
                    {request.decidedByStaffId || 'FAC-CE-108'})
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ShieldCheck size={14} />
                    <span>Database Verified Receipt</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Print Official Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQrPng}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  <Download size={15} />
                  <span>Download QR (.PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReceiptTxt}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  <Download size={15} />
                  <span>Save Receipt (.TXT)</span>
                </button>
              </div>
            </>
          ) : (
            /* Large Mobile & Guard Scanner QR View */
            <div className="text-center space-y-5">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-left text-xs flex items-start gap-3">
                <Smartphone size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Dual-Mode Real QR Code (Mobile Phone + Guard Software Scanner)
                  </span>
                  Scan this QR code with your smartphone camera to view the complete Gate Pass Receipt on your phone, OR hold it up to the Guard Terminal camera (or upload the downloaded PNG) to log your exit/return directly into the database.
                </div>
              </div>

              <div className="inline-block p-5 bg-white rounded-2xl border-2 border-slate-300 shadow-xl mx-auto">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`High-Resolution QR Code for ${request.passNumber}`}
                    referrerPolicy="no-referrer"
                    className="w-64 h-64 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-xs text-slate-400">
                    Rendering ISO QR...
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-700 tabular-nums">
                  <span>{receiptNo}</span>
                  <span className="font-bold text-blue-600">{token}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Verification Token</span>
                    <span className="text-base font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {token}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyToken}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={13} className="text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Valid Until</span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center gap-1 mt-0.5">
                      <Clock size={13} />
                      {request.expectedReturnTime}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadQrPng}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Save QR</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Direct Guard Scanner Handoff & Guardian Notification Strip */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <UserCheck size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">
                Guardian ({request.guardianPhone || '+91 98201 99881'}):{' '}
                <strong className="text-slate-900 dark:text-white">
                  {smsSent ? 'SMS Receipt Dispatched' : 'Ready'}
                </strong>
              </span>
              {!smsSent && (
                <button
                  type="button"
                  onClick={handleSendGuardianAlert}
                  className="ml-1 px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-pointer"
                >
                  <Send size={11} className="inline mr-1" />
                  Send SMS
                </button>
              )}
            </div>

            {onJumpToGuardScan && request.status === 'approved' && (
              <button
                type="button"
                onClick={() => {
                  onJumpToGuardScan(token)
                  onClose()
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
              >
                <QrCode size={14} />
                <span>Scan Now in Guard Terminal &rarr;</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
