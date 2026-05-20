import { createClient as createAdminClient } from '@supabase/supabase-js'
import AdminAddCreditsButton from '@/components/admin/AdminAddCreditsButton'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function AdminCompaniesPage() {
  const supabase = getAdmin()

  const { data: companies } = await supabase
    .from('companies')
    .select('*, users(count), documents(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Empresas</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{companies?.length ?? 0} empresa(s) cadastrada(s)</p>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {['Empresa', 'E-mail', 'CNPJ', 'Usuários', 'Docs', 'Créditos', 'Cadastro', 'Ações'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(companies ?? []).map((c: any) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{c.cnpj ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-center" style={{ color: 'var(--text-secondary)' }}>{c.users?.[0]?.count ?? 0}</td>
                <td className="px-4 py-3 text-sm text-center" style={{ color: 'var(--text-secondary)' }}>{c.documents?.[0]?.count ?? 0}</td>
                <td className="px-4 py-3">
                  <span className="text-sm font-bold px-2 py-0.5 rounded-full"
                    style={{ background: c.credits === 0 ? '#fee2e2' : 'var(--blue-light)', color: c.credits === 0 ? '#dc2626' : 'var(--blue-primary)' }}>
                    {c.credits}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <AdminAddCreditsButton companyId={c.id} companyName={c.name} currentCredits={c.credits} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
