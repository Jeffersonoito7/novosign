'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Shield, CheckCircle, XCircle, RotateCcw, PenLine, FileText, ChevronDown } from 'lucide-react'
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfExpanded, setPdfExpanded] = useState(true)
  const [hasRead, setHasRead] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
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

  useEffect(() => {
    if (step === 'sign') {
      // Aguarda o canvas montar antes de configurar
      setTimeout(() => setupCanvas(), 50)
    }
  }, [step])

  async function initSignPage() {
    setStep('loading')
    const res = await fetch(`/api/sign/${token}`)
    if (!res.ok) { setStep('error'); return }
    const json = await res.json()
    setData(json)
    setStep('otp')
  }

  async function loadPDF() {
    if (pdfUrl) return
    const res = await fetch(`/api/sign/${token}/document`)
    if (res.ok) {
      const json = await res.json()
      setPdfUrl(json.url)
    }
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
      loadPDF()
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
    if (res.ok) { setStep('done') } else { alert('Erro ao registrar assinatura.') }
    setLoading(false)
  }

  function setupCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
  }

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    if (canvas.width === 0) setupCanvas()
    isDrawing.current = true
    const pos = getPos(e, canvas)
    lastPos.current = pos
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1e3a8a'
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    lastPos.current = pos
    setHasSignature(true)
  }

  function stopDraw() {
    isDrawing.current = false
    lastPos.current = null
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
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
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(16,185,129,0.1)' }}>
          <CheckCircle size={48} style={{ color: '#10b981' }} />
        </div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Documento assinado!</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Sua assinatura foi registrada com sucesso.<br />
          Você receberá o PDF assinado por e-mail em breve.
        </p>
        <div className="mt-6 px-4 py-3 rounded-xl text-xs" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
          Assinado em {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </SignLayout>
  )

  if (step === 'rejected') return (
    <SignLayout>
      <div className="text-center py-12">
        <XCircle size={56} className="mx-auto mb-4" style={{ color: '#ef4444' }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Assinatura recusada</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sua recusa foi registrada. O responsável foi notificado.</p>
      </div>
    </SignLayout>
  )

  return (
    <SignLayout wide={step === 'document' || step === 'sign'}>
      {/* Cabeçalho do documento */}
      <div className="rounded-xl border p-4 mb-5 flex items-center gap-3"
        style={{ background: 'var(--blue-light)', borderColor: 'var(--blue-border)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--blue-primary)' }}>
          <FileText size={16} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: 'var(--blue-primary)' }}>Documento para assinatura</p>
          <h2 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{data?.document.title}</h2>
        </div>
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
            <input
              type="text" inputMode="numeric" maxLength={6} required
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-3xl font-bold tracking-widest px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              placeholder="000000"
            />
            {otpError && <p className="text-red-500 text-sm text-center">{otpError}</p>}
            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full text-white py-3 rounded-xl font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{ background: 'var(--blue-primary)' }}>
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
            <button type="button" onClick={initSignPage}
              className="w-full text-sm hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
              Não recebi o código — reenviar
            </button>
          </form>
        </div>
      )}

      {/* Documento + PDF viewer */}
      {step === 'document' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Leia o documento completo</h3>
            <button onClick={() => setPdfExpanded(!pdfExpanded)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <ChevronDown size={14} className={`transition-transform ${pdfExpanded ? 'rotate-180' : ''}`} />
              {pdfExpanded ? 'Minimizar' : 'Expandir'}
            </button>
          </div>

          {/* PDF iframe */}
          {pdfExpanded && (
            <div className="rounded-xl overflow-hidden border mb-4" style={{ borderColor: 'var(--border)', height: 500 }}>
              {pdfUrl ? (
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=0`}
                  className="w-full h-full"
                  title={data?.document.title}
                  onLoad={() => setHasRead(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: 'var(--bg-hover)' }}>
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2"
                      style={{ borderColor: 'var(--blue-primary)', borderTopColor: 'transparent' }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Carregando documento...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Checkbox de leitura */}
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input type="checkbox" checked={hasRead} onChange={e => setHasRead(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Li o documento acima e estou de acordo com seu conteúdo. Ao assinar, confirmo minha
              concordância conforme a <strong style={{ color: 'var(--text-primary)' }}>Lei 14.063/2020</strong>.
            </span>
          </label>

          <button onClick={() => setStep('sign')} disabled={!hasRead}
            className="w-full text-white py-3.5 rounded-xl font-medium disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
            className="w-full mt-3 text-sm hover:opacity-80" style={{ color: '#ef4444' }}>
            Recusar assinatura
          </button>
        </div>
      )}

      {/* Canvas de assinatura */}
      {step === 'sign' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setStep('document')} className="text-sm hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              ← Voltar ao documento
            </button>
          </div>

          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Assine abaixo</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Desenhe sua assinatura no campo abaixo.</p>

          <div className="rounded-xl overflow-hidden mb-3 border-2" style={{ borderColor: hasSignature ? 'var(--blue-primary)' : 'var(--border)', background: '#ffffff' }}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: 180, display: 'block' }}
              className="cursor-crosshair touch-none"
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
            />
          </div>

          <div className="flex items-center justify-between mb-5">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {data?.signatory.name}
            </p>
            <button onClick={clearCanvas} className="flex items-center gap-1 text-xs hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}>
              <RotateCcw size={12} /> Limpar
            </button>
          </div>

          {/* Aviso legal */}
          <div className="rounded-lg px-4 py-3 mb-5 border"
            style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)' }}>
            <p className="text-xs leading-relaxed" style={{ color: '#b45309' }}>
              Ao confirmar, você registra sua assinatura eletrônica com validade jurídica.
              Seus dados de acesso (IP, hora e localização) serão gravados na trilha de auditoria.
            </p>
          </div>

          <button onClick={handleSign} disabled={!hasSignature || loading}
            className="w-full text-white py-3.5 rounded-xl font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ background: '#10b981' }}>
            <CheckCircle size={18} />
            {loading ? 'Registrando assinatura...' : 'Confirmar Assinatura'}
          </button>
        </div>
      )}
    </SignLayout>
  )
}

function SignLayout({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col transition-colors" style={{ background: 'var(--bg)' }}>
      <header className="border-b px-6 py-3 flex items-center gap-3"
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
        <div className={`w-full rounded-2xl border p-8 transition-all ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {children}
        </div>
      </main>

      <footer className="text-center py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        NovoSign · Lei 14.063/2020 · Assinatura Eletrônica Avançada
      </footer>
    </div>
  )
}
