'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Shield, CheckCircle, XCircle, RotateCcw, PenLine } from 'lucide-react'
import { maskEmail } from '@/lib/utils'
import Image from 'next/image'

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
  const [geolocation, setGeolocation] = useState<{ lat: number; lng: number } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    initSignPage()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGeolocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [token])

  async function initSignPage() {
    setStep('loading')
    const res = await fetch(`/api/sign/${token}`)
    if (!res.ok) { setStep('error'); return }
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
    if (res.ok) { setStep('document') } else {
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
    if (res.ok) { setStep('done') } else { alert('Erro ao registrar assinatura.') }
    setLoading(false)
  }

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
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

  function stopDraw() { isDrawing.current = false }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  if (step === 'loading') return (
    <SignLayout>
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--blue-primary)', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
      </div>
    </SignLayout>
  )

  if (step === 'error') return (
    <SignLayout>
      <div className="text-center py-12">
        <XCircle size={48} className="mx-auto mb-4" style={{ color: '#ef4444' }} />
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Link inválido ou expirado</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Este link de assinatura não existe ou já foi utilizado.</p>
      </div>
    </SignLayout>
  )

  if (step === 'done') return (
    <SignLayout>
      <div className="text-center py-12">
        <CheckCircle size={56} className="mx-auto mb-4" style={{ color: '#10b981' }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Documento assinado!</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Sua assinatura foi registrada com sucesso. Você receberá o PDF assinado por e-mail em breve.
        </p>
      </div>
    </SignLayout>
  )

  if (step === 'rejected') return (
    <SignLayout>
      <div className="text-center py-12">
        <XCircle size={56} className="mx-auto mb-4" style={{ color: '#ef4444' }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Assinatura recusada</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Sua recusa foi registrada. O responsável pelo documento foi notificado.
        </p>
      </div>
    </SignLayout>
  )

  return (
    <SignLayout>
      {/* Cabeçalho do documento */}
      <div className="rounded-xl border p-5 mb-6" style={{ background: 'var(--blue-light)', borderColor: 'var(--blue-border)' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--blue-primary)' }}>Documento para assinatura</p>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{data?.document.title}</h2>
        {data?.document.message && (
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{data.document.message}</p>
        )}
        <p className="text-xs mt-3 font-mono" style={{ color: 'var(--text-muted)' }}>
          Hash: {data?.document.file_hash.slice(0, 16)}...
        </p>
      </div>

      {/* OTP */}
      {step === 'otp' && (
        <div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Verificar sua identidade</h3>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Enviamos um código de 6 dígitos para{' '}
            <strong>{data?.signatory.email ? maskEmail(data.signatory.email) : ''}</strong>{' '}
            via {data?.signatory.notification_channel}.
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
                className="w-full text-center text-3xl font-bold tracking-widest px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="000000"
              />
              {otpError && <p className="text-red-500 text-sm mt-2 text-center">{otpError}</p>}
            </div>
            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full text-white py-3 rounded-xl font-medium disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ background: 'var(--blue-primary)' }}>
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
            <button type="button" onClick={initSignPage}
              className="w-full text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}>
              Não recebi o código — reenviar
            </button>
          </form>
        </div>
      )}

      {/* Documento */}
      {step === 'document' && (
        <div>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Leia o documento antes de assinar</h3>
          <div className="rounded-xl border p-5 mb-6 text-sm" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Resumo do que você está assinando:</p>
            <p>• Documento: <strong style={{ color: 'var(--text-primary)' }}>{data?.document.title}</strong></p>
            <p>• Hash SHA-256: <span className="font-mono text-xs">{data?.document.file_hash.slice(0, 32)}...</span></p>
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Ao assinar, você confirma que leu e concorda com o conteúdo do documento, conforme a Lei 14.063/2020.
            </p>
          </div>
          <button onClick={() => setStep('sign')}
            className="w-full text-white py-3 rounded-xl font-medium transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: 'var(--blue-primary)' }}>
            <PenLine size={18} /> Assinar documento
          </button>
          <button
            onClick={async () => {
              const reason = window.prompt('Motivo da recusa (obrigatório):')
              if (reason) {
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
            className="w-full mt-3 text-sm transition-colors hover:opacity-80"
            style={{ color: '#ef4444' }}>
            Recusar assinatura
          </button>
        </div>
      )}

      {/* Canvas de assinatura */}
      {step === 'sign' && (
        <div>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Assine abaixo</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Desenhe sua assinatura no campo abaixo.</p>

          <div className="rounded-xl overflow-hidden mb-3 border-2" style={{ borderColor: 'var(--border)', background: '#ffffff' }}>
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
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Signatário: <strong style={{ color: 'var(--text-secondary)' }}>{data?.signatory.name}</strong>
            </p>
            <button onClick={clearCanvas} className="flex items-center gap-1 text-xs transition-colors hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}>
              <RotateCcw size={12} /> Limpar
            </button>
          </div>

          <div className="rounded-lg px-4 py-3 mb-5 border"
            style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
            <p className="text-xs" style={{ color: '#d97706' }}>
              <strong>Ao clicar em "Confirmar Assinatura"</strong>, você confirma que leu o documento e consente com
              sua assinatura eletrônica, conforme a <strong>Lei 14.063/2020</strong>. Seus dados de acesso
              (IP, hora, localização) serão registrados.
            </p>
          </div>

          <button onClick={handleSign} disabled={!hasSignature || loading}
            className="w-full text-white py-3 rounded-xl font-medium disabled:opacity-40 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: '#10b981' }}>
            <CheckCircle size={18} />
            {loading ? 'Registrando assinatura...' : 'Confirmar Assinatura'}
          </button>

          <button onClick={() => setStep('document')}
            className="w-full mt-3 text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}>
            Voltar
          </button>
        </div>
      )}
    </SignLayout>
  )
}

function SignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col transition-colors" style={{ background: 'var(--bg)' }}>
      <header className="border-b px-6 py-3 flex items-center gap-3 transition-colors"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="NovoSign" width={28} height={28} />
          <h1 className="text-base font-bold" style={{ color: 'var(--blue-primary)' }}>NovoSign</h1>
        </div>
        <span className="text-xs flex items-center gap-1 ml-1" style={{ color: 'var(--text-muted)' }}>
          <Shield size={11} /> Assinatura Eletrônica com Validade Jurídica
        </span>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg rounded-2xl border p-8 transition-colors"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {children}
        </div>
      </main>

      <footer className="text-center py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        Powered by NovoSign · Lei 14.063/2020 · Assinatura Eletrônica Avançada
      </footer>
    </div>
  )
}
