import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const typeLabel: Record<string, string> = {
  purchase: 'Compra',
  bonus: 'Bônus/Admin',
  usage: 'Uso',
}

const typeColor: Record<string, { bg: string; text: string }> = {
  purchase: { bg: '#d1fae5', text: '#065f46' },
  bonus: { bg: '#dbeafe', text: '#1e40af' },
  usage: { bg: '#fee2e2', text: '#991b1b' },
}

export default async function AdminCreditsPage() {
  const supabase = getAdmin()

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const totalPurchased = (transactions ?? []).filter((t: any) => t.type === 'purchase').reduce((a: number, t: any) => a + t.credits, 0)
  const totalBonus = (transactions ?? []).filter((t: any) => t.type === 'bonus').reduce((a: number, t: any) => a + t.credits, 0)
  const totalUsed = (transactions ?? []).filter((t: any) => t.type === 'usage').reduce((a: number, t: any) => a + t.credits, 0)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Créditos</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Histórico de todas as transações</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Comprados', value: totalPurchased, color: '#059669' },
          { label: 'Bônus/Admin', value: totalBonus, color: '#2563eb' },
          { label: 'Utilizados', value: totalUsed, color: '#dc2626' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-3xl font-bold" style={{ color }}>{value.toLocaleString('pt-BR')}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {['Empresa', 'Tipo', 'Créditos', 'Saldo após', 'Descrição', 'Data'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(transactions ?? []).map((t: any) => {
              const colors = typeColor[t.type] ?? { bg: '#f3f4f6', text: '#374151' }
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{(t.companies as any)?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.text }}>
                      {typeLabel[t.type] ?? t.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-bold" style={{ color: t.type === 'usage' ? '#dc2626' : '#059669' }}>
                    {t.type === 'usage' ? '-' : '+'}{t.credits}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{t.balance_after ?? '—'}</td>
                  <td className="px-5 py-3 text-sm max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>{t.description ?? '—'}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {new Date(t.created_at).toLocaleString('pt-BR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
