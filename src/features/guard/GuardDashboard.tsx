import React, { useState, useRef, useEffect, useCallback } from 'react'
import jsQR from 'jsqr'
import {
  Scan,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Wifi,
  WifiOff,
  History,
  Camera,
  CameraOff,
  MapPin,
  Clock,
  Upload,
  Zap,
  QrCode,
  FileCheck2,
} from 'lucide-react'
import type {
  UserProfile,
  GatePassRequest,
  GateEvent,
  GateLocation,
  CampusPolicyConfig,
} from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import {
  parseScannedQrPayload,
  buildUniversalQrPayload,
  generateStandardQrDataUrl,
} from '../../lib/qrAndExport'

interface GuardDashboardProps {
  user: UserProfile
  requests: GatePassRequest[]
  gateEvents: GateEvent[]
  policies: CampusPolicyConfig
  initialScanToken?: string | null
  onClearInitialScanToken?: () => void
  onRecordExit: (
    requestId: string,
    physicalConfirmed: boolean,
    gateLocation: GateLocation,
    remarks: string,
    scanMethod?: GateEvent['scanMethod'],
  ) => void
  onRecordReturn: (
    requestId: string,
    physicalConfirmed: boolean,
    gateLocation: GateLocation,
    remarks: string,
    scanMethod?: GateEvent['scanMethod'],
  ) => void
}

const GATE_LOCATIONS: GateLocation[] = [
  'Main Gate 1 (Central Plaza)',
  'Hostel Gate 2 (North Wing)',
  'Workshop Gate 3 (MIDC Access)',
]

export const GuardDashboard: React.FC<GuardDashboardProps> = ({
  user,
  requests,
  gateEvents,
  policies,
  initialScanToken,
  onClearInitialScanToken,
  onRecordExit,
  onRecordReturn,
}) => {
  const initialMatchedPass = initialScanToken
    ? requests.find(
        (r) =>
          r.qrToken?.toUpperCase() === initialScanToken.trim().toUpperCase() ||
          r.passNumber.toUpperCase() === initialScanToken.trim().toUpperCase() ||
          (r.receiptNumber &&
            r.receiptNumber.toUpperCase() === initialScanToken.trim().toUpperCase()),
      ) || null
    : null

  const [tokenInput, setTokenInput] = useState(
    initialScanToken || 'SG-841-K7X9',
  )
  const [selectedGate, setSelectedGate] = useState<GateLocation>(
    user.assignedGate || 'Main Gate 1 (Central Plaza)',
  )
  const [isOnline, setIsOnline] = useState(true)
  const [physicalIdChecked, setPhysicalIdChecked] = useState(true)
  const [autoRecordToDb, setAutoRecordToDb] = useState(false)
  const [guardRemarks, setGuardRemarks] = useState('')
  const [lastScanMethod, setLastScanMethod] =
    useState<GateEvent['scanMethod']>('software_direct')

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [verifiedQrPreview, setVerifiedQrPreview] = useState<string>('')

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [lookupMessage, setLookupMessage] = useState<{
    type: 'success' | 'error' | 'warning'
    text: string
  } | null>(() => {
    if (!initialMatchedPass) return null
    return {
      type: 'success',
      text: `QR SCANNED (SOFTWARE_DIRECT): Official Receipt ${initialMatchedPass.receiptNumber || initialMatchedPass.passNumber} loaded into Guard Scanner!`,
    }
  })

  const [activeVerifiedPass, setActiveVerifiedPass] = useState<GatePassRequest | null>(
    initialMatchedPass,
  )

  useEffect(() => {
    if (!activeVerifiedPass) return
    let cancelled = false
    generateStandardQrDataUrl(buildUniversalQrPayload(activeVerifiedPass))
      .then((url) => {
        if (!cancelled) setVerifiedQrPreview(url)
      })
      .catch(() => {
        if (!cancelled) setVerifiedQrPreview('')
      })
    return () => {
      cancelled = true
    }
  }, [activeVerifiedPass])

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  const handleVerify = useCallback(
    (
      rawTokenOrPayload?: string,
      method: GateEvent['scanMethod'] = 'manual_token',
      shouldAutoCommit = false,
    ) => {
      const parsedToken = parseScannedQrPayload(rawTokenOrPayload ?? tokenInput)
      setTokenInput(parsedToken)
      setLastScanMethod(method)
      setLookupMessage(null)

      if (!isOnline && policies.strictFailClosedMode) {
        setActiveVerifiedPass(null)
        setLookupMessage({
          type: 'error',
          text: 'ONLINE VERIFICATION UNAVAILABLE (S5): Security invariant requires live database connection. Terminal strictly fails closed.',
        })
        return
      }

      if (!parsedToken) {
        setLookupMessage({
          type: 'warning',
          text: 'Please scan a QR code via camera, upload a QR image, or enter a Pass/Receipt token.',
        })
        return
      }

      const found = requests.find(
        (r) =>
          r.qrToken?.toUpperCase() === parsedToken ||
          r.passNumber.toUpperCase() === parsedToken ||
          (r.receiptNumber || '').toUpperCase() === parsedToken,
      )

      if (!found) {
        setActiveVerifiedPass(null)
        setLookupMessage({
          type: 'error',
          text: `Unrecognized QR token or receipt "${parsedToken}". No matching record found in database.`,
        })
        return
      }

      // Generate QR preview for the verified pass
      generateStandardQrDataUrl(buildUniversalQrPayload(found))
        .then((url) => setVerifiedQrPreview(url))
        .catch(() => setVerifiedQrPreview(''))

      if (found.status === 'expired') {
        setActiveVerifiedPass(found)
        setLookupMessage({
          type: 'error',
          text: `DENIED (S9): Pass ${found.passNumber} has expired. Exit authorization blocked.`,
        })
        return
      }

      if (found.status === 'rejected' || found.status === 'cancelled') {
        setActiveVerifiedPass(found)
        setLookupMessage({
          type: 'error',
          text: `DENIED: Pass ${found.passNumber} is ${found.status}. Exit unauthorized.`,
        })
        return
      }

      if (found.status === 'pending') {
        setActiveVerifiedPass(found)
        setLookupMessage({
          type: 'error',
          text: `DENIED: Pass ${found.passNumber} is still awaiting faculty approval.`,
        })
        return
      }

      setActiveVerifiedPass(found)

      // If Auto-Record Direct to Database on Scan is enabled and S6 is confirmed:
      if ((shouldAutoCommit || autoRecordToDb) && physicalIdChecked) {
        if (found.status === 'approved' && found.gateState === 'no_exit') {
          onRecordExit(
            found.id,
            true,
            selectedGate,
            guardRemarks.trim() || `Direct QR scan (${method}) verified at gate.`,
            method,
          )
          setActiveVerifiedPass({
            ...found,
            gateState: 'exited',
            actualExitTime: 'Just logged to DB',
            exitGate: selectedGate,
          })
          setLookupMessage({
            type: 'success',
            text: `DIRECT DATABASE ENTRY COMPLETE: QR scanned (${method}) & Exit logged for ${found.studentName} (${found.studentRollNo}) at ${selectedGate}.`,
          })
          return
        } else if (found.gateState === 'exited') {
          onRecordReturn(
            found.id,
            true,
            selectedGate,
            guardRemarks.trim() || `Direct QR scan (${method}) return verified at gate.`,
            method,
          )
          setActiveVerifiedPass({
            ...found,
            status: 'completed',
            gateState: 'returned',
            isOverdue: false,
            actualReturnTime: 'Just logged to DB',
            returnGate: selectedGate,
          })
          setLookupMessage({
            type: 'success',
            text: `DIRECT DATABASE RETURN LOGGED: QR scanned (${method}) & Safe Return recorded for ${found.studentName} (${found.studentRollNo}).`,
          })
          return
        }
      }

      if (found.gateState === 'exited') {
        setLookupMessage({
          type: found.isOverdue ? 'error' : 'warning',
          text: found.isOverdue
            ? `OVERDUE RETURN ALERT: Student exited at ${found.actualExitTime} and is +${found.overdueMinutes || 48} mins past deadline. Click "Record Return in Database" below.`
            : `QR SCANNED (${method.toUpperCase()}): ${found.studentName} is currently EXITED off-campus. Ready to log RETURN into database.`,
        })
      } else if (found.gateState === 'returned') {
        setLookupMessage({
          type: 'warning',
          text: `Receipt ${found.receiptNumber || found.passNumber} has already completed its exit-return cycle.`,
        })
      } else {
        setLookupMessage({
          type: 'success',
          text: `QR SCANNED (${method.toUpperCase()}): Official Receipt ${found.receiptNumber || found.passNumber} verified! Click "Authorize & Record Exit in Database" below.`,
        })
      }
    },
    [
      tokenInput,
      isOnline,
      policies.strictFailClosedMode,
      requests,
      autoRecordToDb,
      physicalIdChecked,
      onRecordExit,
      onRecordReturn,
      selectedGate,
      guardRemarks,
    ],
  )

  // Real-time jsQR optical frame loop when camera is running
  useEffect(() => {
    if (!cameraActive) return
    let animationId: number

    const tick = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const qrResult = jsQR(imgData.data, imgData.width, imgData.height)
          if (qrResult && qrResult.data) {
            stopCamera()
            handleVerify(qrResult.data, 'camera_qr', true)
            return
          }
        }
      }
      animationId = requestAnimationFrame(tick)
      rafRef.current = animationId
    }

    animationId = requestAnimationFrame(tick)
    rafRef.current = animationId

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [cameraActive, handleVerify, stopCamera])

  const startCamera = async () => {
    if (onClearInitialScanToken) {
      onClearInitialScanToken()
    }
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      setCameraActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
        }
      }
    } catch {
      setCameraActive(false)
      setCameraError(
        'Webcam access unavailable in this window. Use "Upload QR Image (.PNG)" or click any Pass in the Software Scanner below.',
      )
    }
  }

  // Decode uploaded QR PNG/JPG file using jsQR
  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const decoded = jsQR(imageData.data, imageData.width, imageData.height)
        if (decoded && decoded.data) {
          handleVerify(decoded.data, 'image_qr', autoRecordToDb)
        } else {
          setLookupMessage({
            type: 'error',
            text: 'Could not decode a valid QR matrix from the uploaded image. Try downloading the QR PNG from the Student Pass Receipt first.',
          })
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const handleExitClick = () => {
    if (!activeVerifiedPass) return
    if (!physicalIdChecked) {
      setLookupMessage({
        type: 'error',
        text: 'INVARIANT S6: Guard must confirm physical college ID card inspection before recording exit.',
      })
      return
    }

    onRecordExit(
      activeVerifiedPass.id,
      true,
      selectedGate,
      guardRemarks.trim(),
      lastScanMethod,
    )
    setLookupMessage({
      type: 'success',
      text: `DATABASE UPDATED — EXIT RECORDED: ${activeVerifiedPass.studentName} (${activeVerifiedPass.studentRollNo}) logged exiting via ${selectedGate}.`,
    })
    setActiveVerifiedPass({
      ...activeVerifiedPass,
      gateState: 'exited',
      actualExitTime: 'Just logged',
      exitGate: selectedGate,
    })
    setGuardRemarks('')
  }

  const handleReturnClick = () => {
    if (!activeVerifiedPass) return
    if (!physicalIdChecked) {
      setLookupMessage({
        type: 'error',
        text: 'INVARIANT S6: Guard must inspect physical college ID before recording student return.',
      })
      return
    }

    onRecordReturn(
      activeVerifiedPass.id,
      true,
      selectedGate,
      guardRemarks.trim(),
      lastScanMethod,
    )
    setLookupMessage({
      type: 'success',
      text: `DATABASE UPDATED — RETURN RECORDED: ${activeVerifiedPass.studentName} (${activeVerifiedPass.studentRollNo}) safely returned via ${selectedGate}.`,
    })
    setActiveVerifiedPass({
      ...activeVerifiedPass,
      status: 'completed',
      gateState: 'returned',
      isOverdue: false,
      actualReturnTime: 'Just logged',
      returnGate: selectedGate,
    })
    setGuardRemarks('')
  }

  const scannablePasses = requests.filter(
    (r) => r.status === 'approved' || r.gateState === 'exited',
  )

  return (
    <div className="space-y-6">
      {/* Guard Terminal Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Guard Checkpoint Module
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {user.name} ({user.staffId || 'SEC-GATE-01'})
            </span>
            {user.dutyShift && (
              <>
                <span aria-hidden="true">·</span>
                <span>{user.dutyShift}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Optical QR Scanner & Direct Database Entry Terminal
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs">
            Scan student mobile QR codes via live camera, upload a QR image, or use 1-click software scan to log exits and returns directly into the database.
          </p>
        </div>

        {/* Gate Selector & Network Mode */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <MapPin size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value as GateLocation)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-200 focus:outline-none cursor-pointer"
              aria-label="Select Gate Checkpoint"
            >
              {GATE_LOCATIONS.map((g) => (
                <option key={g} value={g} className="bg-white dark:bg-slate-900">
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 px-2">
              {isOnline ? (
                <Wifi size={14} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <WifiOff size={14} className="text-rose-500" />
              )}
              <span
                className={`text-xs font-bold whitespace-nowrap ${
                  isOnline
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isOnline ? 'DB Connected' : 'Offline (S5 Locked)'}
              </span>
            </div>
            <button
              onClick={() => {
                setIsOnline(!isOnline)
                setLookupMessage(null)
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition cursor-pointer whitespace-nowrap"
            >
              Toggle S5
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Scanner & Verification Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: 3-Way QR Scanner (Camera + Image Upload + Direct Software Scan) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm">
                <Scan size={18} className="text-emerald-600 dark:text-emerald-400" />
                <span>Multi-Mode QR Code Scanner</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                jsQR Optical Engine
              </span>
            </div>

            {/* Mode 1 & 2 Buttons: Live Webcam QR Scan + Upload QR Image */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={cameraActive ? stopCamera : startCamera}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  cameraActive
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`}
              >
                {cameraActive ? (
                  <>
                    <CameraOff size={15} />
                    <span>Stop Camera</span>
                  </>
                ) : (
                  <>
                    <Camera size={15} />
                    <span>1. Live Camera Scan</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-sm"
              >
                <Upload size={15} />
                <span>2. Upload QR Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQrImageUpload}
                className="hidden"
              />
            </div>

            {/* Auto-Record Direct to Database Toggle */}
            <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 cursor-pointer">
              <div className="flex items-center gap-2 text-xs">
                <Zap size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Instant Database Entry on QR Scan
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Automatically log Exit/Return in DB as soon as QR is scanned
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoRecordToDb}
                onChange={(e) => setAutoRecordToDb(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 cursor-pointer"
              />
            </label>

            {/* Live WebRTC Camera Viewfinder with Real jsQR Canvas */}
            {cameraActive && (
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border-2 border-emerald-500 aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-5 border-2 border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="text-[10px] font-mono text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded self-start">
                    POINT MOBILE PHONE QR AT CAMERA
                  </div>
                  <div className="w-full h-0.5 bg-emerald-400" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const target = scannablePasses[0] || requests[0]
                    if (target) {
                      stopCamera()
                      handleVerify(
                        buildUniversalQrPayload(target),
                        'camera_qr',
                        autoRecordToDb,
                      )
                    }
                  }}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-lg"
                >
                  Simulate Phone QR in Frame
                </button>
              </div>
            )}

            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
                {cameraError}
              </div>
            )}

            {/* Manual Token or Receipt Lookup */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Or Enter Pass Token / Receipt Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="SG-841-K7X9 or RCPT-2026-8410"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-sm font-bold text-slate-900 dark:text-white tracking-wider tabular-nums focus:outline-none focus:border-emerald-500 uppercase"
                />
                <button
                  onClick={() => handleVerify(tokenInput, 'manual_token', autoRecordToDb)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:opacity-90 text-white font-bold text-xs transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Mode 3: Software Direct QR Scanner (Scan Active Student Passes in 1 Click) */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <QrCode size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>3. Software QR Scanner (Click to Scan Pass):</span>
                </span>
                <span className="text-[11px] text-slate-400">Direct DB Sync</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {requests.map((r) => {
                  const code = r.qrToken || r.passNumber
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        handleVerify(
                          buildUniversalQrPayload(r),
                          'software_direct',
                          autoRecordToDb,
                        )
                      }
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50/60 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-left text-xs transition cursor-pointer"
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {r.studentName}{' '}
                          <span className="font-mono text-slate-500 dark:text-slate-400 font-normal">
                            ({r.studentRollNo})
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
                          {r.receiptNumber || r.passNumber} · Token: {code}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold whitespace-nowrap shrink-0 ${
                          r.isOverdue && r.gateState === 'exited'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : r.gateState === 'exited'
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                              : r.status === 'approved'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {r.isOverdue && r.gateState === 'exited'
                          ? 'SCAN RETURN (LATE)'
                          : r.gateState === 'exited'
                            ? 'SCAN RETURN'
                            : r.status === 'approved'
                              ? 'SCAN EXIT'
                              : r.status.toUpperCase()}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Scanned Student Receipt Details & Direct Database Entry Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileCheck2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                <span>Scanned Gate Pass Receipt & Identity Match</span>
              </h2>
              {activeVerifiedPass && (
                <StatusBadge
                  status={activeVerifiedPass.status}
                  gateState={activeVerifiedPass.gateState}
                  isOverdue={activeVerifiedPass.isOverdue}
                  priority={activeVerifiedPass.priority}
                  size="md"
                />
              )}
            </div>

            {lookupMessage && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
                  lookupMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : lookupMessage.type === 'error'
                      ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                      : 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                }`}
              >
                {lookupMessage.type === 'success' ? (
                  <CheckCircle2 size={17} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : lookupMessage.type === 'error' ? (
                  <XCircle size={17} className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                ) : (
                  <AlertTriangle size={17} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                )}
                <span className="leading-relaxed font-semibold">{lookupMessage.text}</span>
              </div>
            )}

            {activeVerifiedPass ? (
              <div className="space-y-4">
                {/* Complete Student & Receipt Verification Card */}
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                        {activeVerifiedPass.studentName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-bold block">
                          Receipt {activeVerifiedPass.receiptNumber || 'RCPT-2026-8410'} ·{' '}
                          {activeVerifiedPass.passNumber}
                        </span>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {activeVerifiedPass.studentName}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {activeVerifiedPass.department} · {activeVerifiedPass.year}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase text-slate-400 block">
                          Roll No & Student ID
                        </span>
                        <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums block">
                          {activeVerifiedPass.studentRollNo}
                        </span>
                        <span className="font-mono text-xs text-slate-500 tabular-nums">
                          {activeVerifiedPass.collegeStudentId || 'STU-2026-1042'}
                        </span>
                      </div>
                      {verifiedQrPreview && (
                        <img
                          src={verifiedQrPreview}
                          alt="Verified QR"
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-lg border border-slate-300 bg-white p-1"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Student Phone</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-semibold tabular-nums">
                        {activeVerifiedPass.studentPhone || '+91 98201 12345'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Guardian Contact</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-semibold tabular-nums">
                        {activeVerifiedPass.guardianName ? `${activeVerifiedPass.guardianName}: ` : ''}
                        {activeVerifiedPass.guardianPhone || '+91 98201 99881'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Residence</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {activeVerifiedPass.hostelBlock ||
                          activeVerifiedPass.residenceType ||
                          'Hostel A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Scheduled Leave</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                        {activeVerifiedPass.leaveTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Expected Return</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold tabular-nums flex items-center gap-1">
                        <Clock size={12} />
                        {activeVerifiedPass.expectedReturnTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Approved By</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {activeVerifiedPass.decidedByName || 'Dr. Sunita Patil'}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block">Destination & Approved Reason</span>
                      <span className="text-slate-900 dark:text-white font-semibold">
                        {activeVerifiedPass.destination} — {activeVerifiedPass.reason}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mandatory S6 Physical College ID Confirmation */}
                <div
                  className={`p-4 rounded-xl border transition ${
                    physicalIdChecked
                      ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40'
                      : 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={physicalIdChecked}
                      onChange={(e) => setPhysicalIdChecked(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Physical College ID Card Verified (Invariant S6)
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        Student ID <strong>{activeVerifiedPass.collegeStudentId || 'STU-2026-1042'}</strong> and Roll No{' '}
                        <strong>{activeVerifiedPass.studentRollNo}</strong> matched against physical ID card.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Optional Gate Remarks */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Guard Database Entry Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={guardRemarks}
                    onChange={(e) => setGuardRemarks(e.target.value)}
                    placeholder="e.g. QR scanned via mobile screen, ID verified at gate..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Direct Database Entry Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleExitClick}
                    disabled={
                      activeVerifiedPass.status !== 'approved' ||
                      activeVerifiedPass.gateState !== 'no_exit' ||
                      !physicalIdChecked ||
                      (!isOnline && policies.strictFailClosedMode)
                    }
                    className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-extrabold transition shadow-md ${
                      activeVerifiedPass.status === 'approved' &&
                      activeVerifiedPass.gateState === 'no_exit' &&
                      physicalIdChecked &&
                      (isOnline || !policies.strictFailClosedMode)
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <ArrowRight size={16} />
                    <span>Authorize & Record Exit in Database</span>
                  </button>

                  <button
                    onClick={handleReturnClick}
                    disabled={
                      activeVerifiedPass.gateState !== 'exited' ||
                      !physicalIdChecked ||
                      (!isOnline && policies.strictFailClosedMode)
                    }
                    className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-extrabold transition shadow-md ${
                      activeVerifiedPass.gateState === 'exited' &&
                      physicalIdChecked &&
                      (isOnline || !policies.strictFailClosedMode)
                        ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <RotateCcw size={16} />
                    <span>
                      {activeVerifiedPass.isOverdue
                        ? 'Record Late Return in Database'
                        : 'Record Safe Return in Database'}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <UserCheck size={34} className="mx-auto text-slate-400" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Ready to Scan QR & Record Database Entry
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Use Live Camera Scan, upload a saved QR image, or click any student pass in the Software QR Scanner on the left.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Gate Entry Logbook */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              Live Gate Database Entries ({gateEvents.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Real-Time Accurate Timestamps
          </span>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {gateEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${
                    evt.eventType === 'exit'
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {evt.eventType === 'exit' ? <ArrowRight size={15} /> : <RotateCcw size={15} />}
                </div>

                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {evt.studentName}{' '}
                    <span className="font-mono text-slate-500 font-normal tabular-nums">
                      ({evt.studentRollNo} · {evt.collegeStudentId || 'STU-2026-1042'})
                    </span>{' '}
                    ·{' '}
                    <span className="uppercase text-[11px] font-extrabold text-blue-600 dark:text-blue-400">
                      {evt.eventType}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Receipt: {evt.receiptNumber || evt.passNumber} · {evt.gateLocation} · Guard:{' '}
                    {evt.guardName} · {evt.note}
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono tabular-nums space-y-0.5 shrink-0">
                <span className="text-slate-800 dark:text-slate-200 font-bold block">
                  {evt.timestamp}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                  <ShieldCheck size={12} />
                  QR & ID Logged in DB
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
