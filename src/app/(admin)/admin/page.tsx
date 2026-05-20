import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Building2, Users, FileText, CreditCard, TrendingUp, CheckCircle } from 'lucide-react'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function AdminPage() {
  const supabase = getAdmin()

  const [
    { count: totalCompanies },
    { count: totalUsers },
    { count: totalDocuments },
    { count: completedDocuments },
    { data: recentCompanies },
    { data: creditStats },
  ] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('companies').select('id, name, email, credits, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('credit_transactions').select('credits, type').eq('type', 'purchase'),
  ])

  const totalRevenue = (creditStats ?? []).reduce((acc: number, t: any) => acc + (t.credits ?? 0), 0)

  const cards = [
    { label: 'Empresas', value: totalCompanies ?? 0, icon: Building2, color: '#2563eb' },
    { label: 'Usuários', value: totalUsers ?? 0, icon: Users, color: '#7c3aed' },
    { label: 'Documentos', value: totalDocuments ?? 0, icon: FileText, color: '#0891b2' },
    { label: 'Concluídos', value: completedDocuments ?? 0, icon: CheckCircle, color: '#059669' },
    { label: 'Créditos vendidos', value: totalRevenue, icon: TrendingUp, color: '#d97706' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Painel Admin</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Visão geral de toda a plataforma NovoSign</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value.toLocaleString('pt-BR')}</p>
          </div>
        ))}
      </div>

      {/* Últimas empresas */}
      <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Últimas empresas cadastradas</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Empresa', 'E-mail', 'Créditos', 'Criada em'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(recentCompanies ?? []).map((c: any) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--blue-light)', color: 'var(--blue-primary)' }}>
                    {c.credits}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
