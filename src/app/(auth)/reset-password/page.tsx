'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError('Erro ao redefinir senha. Tente novamente.') }
    else { router.push('/dashboard') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image src="/logo.svg" alt="NovoSign" width={44} height={44} />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--blue-primary)' }}>NovoSign</h1>
          </div>
        </div>
        <div className="rounded-2xl border p-8" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Redefinir senha</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nova senha</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Confirmar senha</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="Repita a nova senha" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ background: 'var(--blue-primary)' }}>
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
