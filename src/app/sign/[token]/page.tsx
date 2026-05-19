'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Shield, CheckCircle, XCircle, RotateCcw, PenLine } from 'lucide-react'
import { maskEmail } from '@/lib/utils'

type Step = 'loading' | 'error' | 'otp' | 'document' | 'sign' | 'done' | 'rejected'

interface SignData {
  signatory: { id: string; name: string; email: string; notification_channel: string }
  document: { title: string; message?: string; file_hash: string }
}

export default function SignPage() {
  const { token } = useParams<{ token: string }>()
  const [step, setStep] = useState<Step>('loading')
  const [data, setData] = useState<SignData | null>(null)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [geolocation, setGeolocation] = useState<{ lat: number; lng: number } | null>(null)

  // Canvas ref para assinatura
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    initSignPage()
    // Capturar geolocalização
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setGeolocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      }, () => {})
    }
  }, [token])

  async function initSignPage() {
    setStep('loading')
    const res = await fetch(`/api/sign/${token}`)
    if (!res.ok) {
      setStep('error')
      return
    }
    const json = await res.json()
    setData(json)
    setStep('otp')
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setOtpError('')
    const res = await fetch(`/api/sign/${token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: otp }),
    })
    if (res.ok) {
      setStep('document')
    } else {
      const json = await res.json()
      setOtpError(json.error ?? 'Código inválido.')
    }
    setLoading(false)
  }

  async function handleSign() {
    setLoading(true)
    const canvas = canvasRef.current
    const signatureImageBase64 = canvas ? canvas.toDataURL('image/png') : null

    const res = await fetch(`/api/sign/${token}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatureImageBase64, geolocation }),
    })
    if (res.ok) {
      setStep('done')
    } else {
      alert('Erro ao registrar assinatura.')
    }
    setLoading(false)
  }

  async function handleReject() {
    if (!rejectReason.trim()) return
    setLoading(true)
    const res = await fetch(`/api/sign/${token}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReason }),
    })
    if (res.ok) {
      setStep('rejected')
    }
    setLoading(false)
  }

  // Canvas drawing
  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    isDrawing.current = true
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1e3a8a'
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasSignature(true)
  }

  function stopDraw() {
    isDrawing.current = false
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  if (step === 'loading') {
    return (
      <SignLayout>
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </SignLayout>
    )
  }

  if (step === 'error') {
    return (
      <SignLayout>
        <div className="text-center py-12">
          <XCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Link inválido ou expirado</h2>
          <p className="text-gray-500 text-sm">Este link de assinatura não existe ou já foi utilizado.</p>
        </div>
      </SignLayout>
    )
  }

  if (step === 'done') {
    return (
      <SignLayout>
        <div className="text-center py-12">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Documento assinado!</h2>
          <p className="text-gray-500 text-sm">Sua assinatura foi registrada com sucesso. Você receberá o PDF assinado por e-mail em breve.</p>
        </div>
      </SignLayout>
    )
  }

  if (step === 'rejected') {
    return (
      <SignLayout>
        <div className="text-center py-12">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Assinatura recusada</h2>
          <p className="text-gray-500 text-sm">Sua recusa foi registrada. O responsável pelo documento foi notificado.</p>
        </div>
      </SignLayout>
    )
  }

  return (
    <SignLayout>
      {/* Cabeçalho do documento */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
        <p className="text-xs font-medium text-blue-600 mb-1">Documento para assinatura</p>
        <h2 className="text-lg font-bold text-gray-900">{data?.document.title}</h2>
        {data?.document.message && (
          <p className="text-sm text-gray-600 mt-2">{data.document.message}</p>
        )}
        <p className="text-xs text-gray-400 mt-3 font-mono">Hash: {data?.document.file_hash.slice(0, 16)}...</p>
      </div>

      {/* Step OTP */}
      {step === 'otp' && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Verificar sua identidade</h3>
          <p className="text-sm text-gray-500 mb-5">
            Enviamos um código de 6 dígitos para <strong>{data?.signatory.email ? maskEmail(data.signatory.email) : ''}</strong> via {data?.signatory.notification_channel}.
          </p>
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl font-bold tracking-widest px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000000"
              />
              {otpError && <p className="text-red-500 text-sm mt-2 text-center">{otpError}</p>}
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
            <button
              type="button"
              onClick={initSignPage}
              className="w-full text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              Não recebi o código — reenviar
            </button>
          </form>
        </div>
      )}

      {/* Step Documento */}
      {step === 'document' && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Leia o documento antes de assinar</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-2">Resumo do que você está assinando:</p>
            <p>• Documento: <strong>{data?.document.title}</strong></p>
            <p>• Hash SHA-256: <span className="font-mono text-xs">{data?.document.file_hash.slice(0, 32)}...</span></p>
            <p className="text-xs text-gray-400 mt-3">
              Ao assinar, você confirma que leu e concorda com o conteúdo do documento acima, conforme a Lei 14.063/2020.
            </p>
          </div>
              <div className="flex gap-3">
            <button
              onClick={() => setStep('sign')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <PenLine size={18} /> Assinar documento
            </button>
          </div>
          <button
            onClick={async () => {
              const reason = window.prompt('Motivo da recusa (obrigatório):')
              if (reason) {
                setRejectReason(reason)
                setLoading(true)
                await fetch(`/api/sign/${token}/reject`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reason }),
                })
                setStep('rejected')
                setLoading(false)
              }
            }}
            className="w-full mt-3 text-sm text-red-500 hover:underline text-center"
          >
            Recusar assinatura
          </button>
        </div>
      )}

      {/* Step Assinatura */}
      {step === 'sign' && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Assine abaixo</h3>
          <p className="text-sm text-gray-500 mb-4">Desenhe sua assinatura no campo abaixo.</p>

          <div className="border-2 border-gray-300 rounded-xl overflow-hidden mb-3 bg-white">
            <canvas
              ref={canvasRef}
              width={520}
              height={160}
              className="w-full cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>

          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-gray-400">Signatário: <strong>{data?.signatory.name}</strong></p>
            <button
              onClick={clearCanvas}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw size={12} /> Limpar
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
            <p className="text-xs text-amber-700">
              <strong>Ao clicar em "Confirmar Assinatura"</strong>, você confirma que leu o documento e consente com sua assinatura eletrônica, conforme a <strong>Lei 14.063/2020</strong>. Seus dados de acesso (IP, hora, localização) serão registrados.
            </p>
          </div>

          <button
            onClick={handleSign}
            disabled={!hasSignature || loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            {loading ? 'Registrando assinatura...' : 'Confirmar Assinatura'}
          </button>

          <button
            onClick={() => setStep('document')}
            className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600"
          >
            Voltar
          </button>
        </div>
      )}
    </SignLayout>
  )
}

function SignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <h1 className="text-lg font-bold text-blue-600">NovoSign</h1>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Shield size={12} /> Assinatura Eletrônica com Validade Jurídica
        </span>
      </header>
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {children}
        </div>
      </main>
      <footer className="text-center py-4 text-xs text-gray-400">
        Powered by NovoSign · Lei 14.063/2020 · Assinatura Eletrônica Avançada
      </footer>
    </div>
  )
}
