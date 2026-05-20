'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError('Erro ao enviar e-mail. Verifique o endereço.') }
    else { setSent(true) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 transition-colors" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image src="/logo.svg" alt="NovoSign" width={44} height={44} />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--blue-primary)' }}>NovoSign</h1>
          </div>
        </div>
        <div className="rounded-2xl border p-8" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(16,185,129,0.1)' }}>
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>E-mail enviado!</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Verifique sua caixa de entrada em <strong>{email}</strong> e clique no link para redefinir sua senha.
              </p>
              <Link href="/login" className="text-sm font-medium hover:underline" style={{ color: 'var(--blue-primary)' }}>
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Esqueceu a senha?</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>E-mail</label>
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="seu@email.com"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--blue-primary)' }}>
                  {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                </button>
              </form>
              <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
                <Link href="/login" className="hover:underline" style={{ color: 'var(--blue-primary)' }}>← Voltar para o login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
