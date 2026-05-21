'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Plus, Trash2 } from 'lucide-react'
import type { NotificationChannel } from '@/types'

interface SignatoryInput {
  name: string
  email: string
  phone: string
  cpf: string
  notification_channel: NotificationChannel
}

function validarCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '')
  if (nums.length !== 11) return false
  if (/^(\d)\1{10}$/.test(nums)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(nums[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  return rest === parseInt(nums[10])
}

function formatarCPF(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  return nums
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function signatoryIsValid(s: SignatoryInput): boolean {
  if (!s.name.trim()) return false
  if (!validarEmail(s.email)) return false
  if (!validarCPF(s.cpf)) return false
  if (s.notification_channel === 'whatsapp' && !s.phone.replace(/\D/g, '').trim()) return false
  return true
}

export default function NewDocumentPage() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'signatories' | 'review'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [signatories, setSignatories] = useState<SignatoryInput[]>([
    { name: '', email: '', phone: '', cpf: '', notification_channel: 'email' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tried, setTried] = useState(false)

  const allValid = signatories.every(signatoryIsValid)

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]
    if (f) {
      setFile(f)
      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
    }
  }, [title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  })

  function addSignatory() {
    setSignatories(prev => [...prev, { name: '', email: '', phone: '', cpf: '', notification_channel: 'email' }])
    setTried(false)
  }

  function removeSignatory(i: number) {
    setSignatories(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateSignatory(i: number, field: keyof SignatoryInput, value: string) {
    setSignatories(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function handleRevisar() {
    setTried(true)
    if (!allValid) return
    setError('')
    setStep('review')
  }

  async function handleSubmit() {
    if (!allValid) { setError('Corrija os erros antes de enviar.'); return }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file!)
      formData.append('title', title)
      if (message) formData.append('message', message)
      formData.append('signatories', JSON.stringify(signatories))
      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Erro ao criar documento.')
      router.push(`/documents/${body.documentId}`)
    } catch (err: any) {
      setError(err.message ?? 'Erro inesperado.')
      setLoading(false)
    }
  }

  const err = (show: boolean, msg: string) => show && tried ? (
    <p className="text-red-500 text-xs mt-0.5">{msg}</p>
  ) : null

  const borderErr = (invalid: boolean) =>
    tried && invalid ? 'border-red-400 bg-red-50' : 'border-gray-300'

  const inputCls = (invalid: boolean) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${tried && invalid ? 'border-red-400' : 'border-gray-300'}`

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Novo Documento</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Faça upload do PDF e defina quem precisa assinar.</p>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {(['upload', 'signatories', 'review'] as const).map((s, i) => {
          const labels = { upload: 'Documento', signatories: 'Assinantes', review: 'Revisar' }
          const active = step === s
          const done = ['upload', 'signatories', 'review'].indexOf(step) > i
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 ${done || active ? 'bg-blue-400' : 'bg-gray-200'}`} />}
              <div className={`flex items-center gap-2 text-sm font-medium ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-blue-600 text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {done ? 'OK' : i + 1}
                </span>
                {labels[s]}
              </div>
            </div>
          )
        })}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-5">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-400 bg-blue-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div>
                <FileText size={32} className="text-green-500 mx-auto mb-2" />
                <p className="font-medium text-green-700">{file.name}</p>
                <p className="text-sm text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <Upload size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="font-medium text-gray-600">Arraste o PDF aqui ou clique para selecionar</p>
                <p className="text-sm text-gray-400 mt-1">PDF até 20MB</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Título do documento <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
              placeholder="Ex: Contrato de Prestação de Serviços"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Mensagem para os assinantes <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
              placeholder="Olá! Por favor, assine o documento abaixo..."
            />
          </div>

          <button
            disabled={!file || !title.trim()}
            onClick={() => setStep('signatories')}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Próximo: Definir Assinantes
          </button>
        </div>
      )}

      {/* Step 2: Assinantes */}
      {step === 'signatories' && (
        <div className="space-y-4">
          {signatories.map((sig, i) => (
            <div key={i} className="rounded-xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Assinante {i + 1}</h3>
                {signatories.length > 1 && (
                  <button onClick={() => removeSignatory(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Nome */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Nome completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={sig.name}
                    onChange={e => updateSignatory(i, 'name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${tried && !sig.name.trim() ? 'border-red-400' : 'border-gray-300'}`}
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    placeholder="João da Silva"
                  />
                  {err(!sig.name.trim(), 'Nome obrigatório')}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={sig.email}
                    onChange={e => updateSignatory(i, 'email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${tried && !validarEmail(sig.email) ? 'border-red-400' : 'border-gray-300'}`}
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    placeholder="joao@email.com"
                  />
                  {err(!validarEmail(sig.email), 'E-mail inválido')}
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={sig.cpf}
                    onChange={e => updateSignatory(i, 'cpf', formatarCPF(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${tried && !validarCPF(sig.cpf) ? 'border-red-400' : 'border-gray-300'}`}
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    placeholder="000.000.000-00"
                  />
                  {err(!validarCPF(sig.cpf), 'CPF inválido')}
                </div>

                {/* Canal */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Canal de verificação <span style={{ color: 'var(--blue-primary)' }}>(recomendado: E-mail)</span>
                  </label>
                  <select
                    value={sig.notification_channel}
                    onChange={e => updateSignatory(i, 'notification_channel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="email">E-mail (maior validade jurídica)</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>

                {/* Telefone / WhatsApp */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: sig.notification_channel === 'whatsapp' ? '#dc2626' : 'var(--text-secondary)' }}>
                    {sig.notification_channel === 'whatsapp' ? 'Telefone / WhatsApp *' : 'Telefone / WhatsApp (opcional)'}
                  </label>
                  <input
                    value={sig.phone}
                    onChange={e => updateSignatory(i, 'phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${tried && sig.notification_channel === 'whatsapp' && !sig.phone.replace(/\D/g, '').trim() ? 'border-red-400' : 'border-gray-300'}`}
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    placeholder={sig.notification_channel === 'whatsapp' ? 'Ex: 87999999999' : '(87) 99999-9999'}
                  />
                  {err(sig.notification_channel === 'whatsapp' && !sig.phone.replace(/\D/g, '').trim(), 'Número de WhatsApp obrigatório')}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addSignatory}
            className="w-full border border-dashed border-gray-300 text-gray-500 py-2.5 rounded-xl text-sm hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Adicionar assinante
          </button>

          {tried && !allValid && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
              Corrija os campos em vermelho antes de continuar.
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setTried(false); setStep('upload') }}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleRevisar}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Revisar
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Revisão */}
      {step === 'review' && (
        <div className="space-y-5">
          <div className="rounded-xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Documento</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--blue-light)' }}>
                <FileText size={18} style={{ color: 'var(--blue-primary)' }} />
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{file?.name} · {(file!.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            {message && (
              <div className="mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{message}</div>
            )}
          </div>

          <div className="rounded-xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>{signatories.length} Assinante(s)</h3>
            <div className="space-y-2">
              {signatories.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{i + 1}</div>
                  <div className="flex-1">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{s.email}</span>
                    {s.cpf && <span className="ml-2" style={{ color: 'var(--text-muted)' }}>· CPF: {s.cpf}</span>}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.notification_channel === 'email' ? 'E-mail' : s.notification_channel}</span>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('signatories')}
              className="flex-1 border py-2.5 rounded-lg font-medium text-sm transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Criando...' : 'Criar Documento'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
