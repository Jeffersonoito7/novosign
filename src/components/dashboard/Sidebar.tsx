'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { FileText, LayoutDashboard, Users, Settings, LogOut, FileCheck, Zap, Key, Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/documents', label: 'Documentos', icon: FileText },
  { href: '/templates', label: 'Templates', icon: FileCheck },
  { href: '/contacts', label: 'Contatos', icon: Users },
  { href: '/api-keys', label: 'API & Integrações', icon: Key },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export default function Sidebar({ user, credits }: { user: any; credits: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 flex flex-col shrink-0 border-r transition-colors"
      style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>

      {/* Logo */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <Image
          src="/novosign.png"
          alt="NovoSign"
          width={130}
          height={44}
          style={{ objectFit: 'contain', filter: 'var(--logo-filter)' }}
        />
        <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
          {user?.companies?.name ?? 'Minha Empresa'}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              )}
              style={{
                background: active ? 'var(--blue-light)' : 'transparent',
                color: active ? 'var(--blue-primary)' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Créditos */}
      <div className="px-3 pb-2">
        <Link
          href="/credits"
          className="flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors"
          style={{
            background: credits === 0 ? '#fef2f2' : 'var(--blue-light)',
            borderColor: credits === 0 ? '#fecaca' : 'var(--blue-border)',
            color: credits === 0 ? '#dc2626' : 'var(--blue-primary)',
          }}
        >
          <div className="flex items-center gap-2">
            <Zap size={15} />
            <span className="font-medium">
              {credits === 0 ? 'Sem créditos' : `${credits} crédito${credits !== 1 ? 's' : ''}`}
            </span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: credits === 0 ? '#fee2e2' : 'var(--blue-border)', color: 'inherit' }}>
            + Comprar
          </span>
        </Link>
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t space-y-0.5" style={{ borderColor: 'var(--border)' }}>

        {/* Toggle tema */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {theme === 'dark'
            ? <Sun size={16} className="text-yellow-400" />
            : <Moon size={16} />
          }
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>

        {/* Usuário */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--blue-primary)' }}>
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
