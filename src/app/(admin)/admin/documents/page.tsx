import { createClient as createAdminClient } from '@supabase/supabase-js'
import AdminDeleteDocumentButton from '@/components/admin/AdminDeleteDocumentButton'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const statusLabel: Record<string, string> = {
  draft: 'Rascunho',
  pending: 'Aguardando',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const statusColor: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#f3f4f6', color: '#6b7280' },
  pending: { bg: '#fef3c7', color: '#d97706' },
  completed: { bg: '#d1fae5', color: '#065f46' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
}

export default async function AdminDocumentsPage() {
  const supabase = getAdmin()

  const { data: documents } = await supabase
    .from('documents')
    .select('*, companies(name), signatories(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Documentos</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{documents?.length ?? 0} documento(s) no sistema</p>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {['Título', 'Empresa', 'Status', 'Assinantes', 'Criado em', 'Ações'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(documents ?? []).map((doc: any) => {
              const sc = statusColor[doc.status] ?? statusColor.draft
              return (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 text-sm font-medium max-w-xs truncate" style={{ color: 'var(--text-primary)' }}>{doc.title}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{doc.companies?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                      {statusLabel[doc.status] ?? doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                    {doc.signatories?.[0]?.count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <AdminDeleteDocumentButton documentId={doc.id} title={doc.title} />
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
