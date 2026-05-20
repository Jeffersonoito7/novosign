'use client'

import { useState, useEffect } from 'react'
import { Upload, Users, CheckCircle, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    icon: Upload,
    title: 'Faça upload do PDF',
    desc: 'Envie qualquer contrato ou documento em PDF. Suportamos até 20MB.',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
  },
  {
    icon: Users,
    title: 'Defina os signatários',
    desc: 'Adicione nome, e-mail e CPF de quem precisa assinar. Notificamos por e-mail ou WhatsApp.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
  },
  {
    icon: CheckCircle,
    title: 'Receba o PDF assinado',
    desc: 'Após todas as assinaturas, geramos o PDF com certificado e trilha de auditoria.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
  },
]

export default function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem('novosign_onboarding_done')
    if (!seen) setOpen(true)
  }, [])

  function handleClose() {
    localStorage.setItem('novosign_onboarding_done', '1')
    setOpen(false)
  }

  if (!open) return null

  const step = steps[currentStep]
  const Icon = step.icon
  const isLast = currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border p-8 relative"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

        <button onClick={handleClose}
          className="absolute top-4 right-4 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}>
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Bem-vindo ao NovoSign 🎉
          </p>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Como funciona em 3 passos
          </h2>
        </div>

        {/* Step */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: step.bg }}>
            <Icon size={32} style={{ color: step.color }} />
          </div>
          <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Passo {currentStep + 1} de {steps.length}
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {step.title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {step.desc}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 justify-center mb-6">
          {steps.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all"
              style={{
                width: i === currentStep ? 24 : 8,
                background: i <= currentStep ? 'var(--blue-primary)' : 'var(--border)',
              }} />
          ))}
        </div>

        {/* Actions */}
        {isLast ? (
          <div className="space-y-3">
            <Link href="/documents/new" onClick={handleClose}
              className="flex items-center justify-center gap-2 w-full text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
              style={{ background: 'var(--blue-primary)' }}>
              Criar meu primeiro documento <ArrowRight size={16} />
            </Link>
            <button onClick={handleClose}
              className="w-full text-sm py-2 hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-muted)' }}>
              Explorar o dashboard
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl text-sm border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              Pular
            </button>
            <button onClick={() => setCurrentStep(s => s + 1)}
              className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ background: 'var(--blue-primary)' }}>
              Próximo <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
