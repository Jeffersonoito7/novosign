'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { FileText, LayoutDashboard, Users, Settings, LogOut, FileCheck, Zap, Key } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 flex flex-col bg-white border-r border-gray-200 shrink-0">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="NovoSign" width={36} height={36} />
          <div>
            <h1 className="text-lg font-bold text-blue-600 leading-none">NovoSign</h1>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.companies?.name ?? 'Minha Empresa'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Saldo de créditos */}
      <div className="px-3 pb-2">
        <Link
          href="/credits"
          className={cn(
            'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors',
            credits === 0
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-100'
          )}
        >
          <div className="flex items-center gap-2">
            <Zap size={15} className={credits === 0 ? 'text-red-500' : 'text-blue-600'} />
            <span className={`font-medium ${credits === 0 ? 'text-red-700' : 'text-blue-700'}`}>
              {credits === 0 ? 'Sem créditos' : `${credits} crédito${credits !== 1 ? 's' : ''}`}
            </span>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${credits === 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            {credits === 0 ? 'Comprar' : '+ Comprar'}
          </span>
        </Link>
      </div>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
