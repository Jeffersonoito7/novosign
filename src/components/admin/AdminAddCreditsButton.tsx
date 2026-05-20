'use client'

import { useState } from 'react'
import { PlusCircle } from 'lucide-react'

export default function AdminAddCreditsButton({
  companyId,
  companyName,
  currentCredits,
}: {
  companyId: string
  companyName: string
  currentCredits: number
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qty = parseInt(amount)
    if (!qty || qty <= 0) return

    setLoading(true)
    const res = await fetch('/api/admin/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, credits: qty, reason: reason || 'Adicionado pelo admin' }),
    })

    setLoading(false)
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => { setOpen(false); setSuccess(false); setAmount(''); setReason('') }, 1500)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
        style={{ background: 'var(--blue-light)', color: 'var(--blue-primary)' }}
      >
        <PlusCircle size={12} />
        Créditos
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Adicionar créditos</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{companyName} · {currentCredits} créditos atuais</p>

            {success ? (
              <p className="text-center text-green-600 font-semibold py-4">✅ Créditos adicionados!</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="Ex: 10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>Motivo (opcional)</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="Bônus, cortesia, etc."
                  />
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
                    {loading ? 'Salvando...' : 'Adicionar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
