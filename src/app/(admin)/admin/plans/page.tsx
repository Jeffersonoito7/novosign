import { createClient as createAdminClient } from '@supabase/supabase-js'
import AdminPlanForm from '@/components/admin/AdminPlanForm'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function AdminPlansPage() {
  const supabase = getAdmin()
  const { data: plans } = await supabase.from('plans').select('*').order('price_monthly')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Planos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Gerencie os planos disponíveis na plataforma</p>
        </div>
        <AdminPlanForm />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(plans ?? []).map((plan: any) => (
          <div key={plan.id} className="rounded-xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--blue-primary)' }}>
                  R$ {Number(plan.price_monthly).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/mês</span>
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>📄 {plan.documents_limit} documentos/mês</p>
              <p>👥 {plan.users_limit} usuários</p>
              {(plan.features ?? []).map((f: string, i: number) => (
                <p key={i}>✅ {f}</p>
              ))}
            </div>
          </div>
        ))}

        {(!plans || plans.length === 0) && (
          <div className="col-span-3 text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <p className="text-lg mb-2">Nenhum plano cadastrado.</p>
            <p className="text-sm">Clique em "Novo Plano" para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
