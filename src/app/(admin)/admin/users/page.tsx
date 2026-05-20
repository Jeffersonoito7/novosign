import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const roleLabel: Record<string, string> = {
  owner: 'Dono',
  admin: 'Admin',
  member: 'Membro',
  superadmin: 'Super Admin',
}

const roleColor: Record<string, string> = {
  owner: '#7c3aed',
  admin: '#2563eb',
  member: '#6b7280',
  superadmin: '#dc2626',
}

export default async function AdminUsersPage() {
  const supabase = getAdmin()

  const { data: users } = await supabase
    .from('users')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Usuários</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{users?.length ?? 0} usuário(s) cadastrado(s)</p>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {['Nome', 'E-mail', 'Empresa', 'Perfil', 'Cadastro'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u: any) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: roleColor[u.role] ?? '#6b7280' }}>
                      {u.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{(u.companies as any)?.name ?? '—'}</td>
                <td className="px-6 py-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: `${roleColor[u.role] ?? '#6b7280'}15`, color: roleColor[u.role] ?? '#6b7280' }}>
                    {roleLabel[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
