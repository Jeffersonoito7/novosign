'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminPlanForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [docsLimit, setDocsLimit] = useState('')
  const [usersLimit, setUsersLimit] = useState('')
  const [feature, setFeature] = useState('')
  const [features, setFeatures] = useState<string[]>([])

  function addFeature() {
    if (feature.trim()) {
      setFeatures(prev => [...prev, feature.trim()])
      setFeature('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        price_monthly: parseFloat(price),
        documents_limit: parseInt(docsLimit),
        users_limit: parseInt(usersLimit),
        features,
      }),
    })
    setLoading(false)
    if (res.ok) {
      setOpen(false)
      setName(''); setPrice(''); setDocsLimit(''); setUsersLimit(''); setFeatures([])
      router.refresh()
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
        style={{ background: 'var(--blue-primary)' }}>
        <Plus size={16} /> Novo Plano
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md shadow-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Novo Plano</h3>
              <button onClick={() => setOpen(false)}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>Nome do plano</label>
                  <input required value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="Ex: Básico" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>Preço/mês (R$)</label>
                  <input required type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="49.90" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>Limite de docs</label>
                  <input required type="number" min="1" value={docsLimit} onChange={e => setDocsLimit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="50" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>Limite de usuários</label>
                  <input required type="number" min="1" value={usersLimit} onChange={e => setUsersLimit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="3" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>Funcionalidades</label>
                <div className="flex gap-2 mb-2">
                  <input value={feature} onChange={e => setFeature(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }}
                    className="flex-1 px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="Ex: WhatsApp incluso" />
                  <button type="button" onClick={addFeature}
                    className="px-3 py-2 rounded-lg text-sm font-medium"
                    style={{ background: 'var(--blue-light)', color: 'var(--blue-primary)' }}>
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {features.map((f, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                      style={{ background: 'var(--blue-light)', color: 'var(--blue-primary)' }}>
                      {f}
                      <button type="button" onClick={() => setFeatures(prev => prev.filter((_, j) => j !== i))}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-lg border text-sm font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'var(--blue-primary)' }}>
                  {loading ? 'Criando...' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
