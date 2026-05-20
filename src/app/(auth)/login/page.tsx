'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 transition-colors" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image src="/logo.svg" alt="NovoSign" width={52} height={52} />
            <h1 className="text-3xl font-bold" style={{ color: 'var(--blue-primary)' }}>NovoSign</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Assinatura Eletrônica com Validade Jurídica</p>
        </div>

        <div className="rounded-2xl border p-8 transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Entrar na sua conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Senha</label>
                <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--blue-primary)' }}>Esqueceu a senha?</Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ background: 'var(--blue-primary)' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            Não tem conta?{' '}
            <Link href="/register" className="text-blue-600 font-medium hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
