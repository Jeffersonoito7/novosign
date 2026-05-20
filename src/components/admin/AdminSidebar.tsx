'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Users, CreditCard, Package, LogOut, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/companies', label: 'Empresas', icon: Building2 },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/credits', label: 'Créditos', icon: CreditCard },
  { href: '/admin/plans', label: 'Planos', icon: Package },
]

export default function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 flex flex-col shrink-0 border-r" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>
      <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Image src="/novosign.png" alt="NovoSign" width={100} height={36} style={{ objectFit: 'contain' }} />
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: '#dc2626', color: '#fff' }}>Admin</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors')}
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

      <div className="px-3 py-4 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <LayoutDashboard size={16} />
          Ir para o App
        </Link>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--blue-primary)' }}>
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>superadmin</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
