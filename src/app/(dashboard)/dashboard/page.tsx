import { createClient } from '@/lib/supabase/server'
import { FileText, Clock, CheckCircle, XCircle, Plus } from 'lucide-react'
import Link from 'next/link'
import { documentStatusLabel, formatDate } from '@/lib/utils'
import OnboardingModal from '@/components/dashboard/OnboardingModal'

async function getStats(companyId: string) {
  const supabase = await createClient()
  const [total, pending, completed, cancelled] = await Promise.all([
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending'),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'completed'),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'cancelled'),
  ])
  return { total: total.count ?? 0, pending: pending.count ?? 0, completed: completed.count ?? 0, cancelled: cancelled.count ?? 0 }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('*, companies(*)').eq('id', user!.id).single()
  const stats = await getStats(profile?.company_id)
  const { data: recentDocs } = await supabase
    .from('documents').select('*, signatories(id, status)')
    .eq('company_id', profile?.company_id)
    .order('created_at', { ascending: false }).limit(5)

  const statCards = [
    { label: 'Total de documentos', value: stats.total, icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Aguardando assinatura', value: stats.pending, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Concluídos', value: stats.completed, icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Cancelados', value: stats.cancelled, icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  ]

  const statusColors: Record<string, { bg: string; color: string }> = {
    draft: { bg: 'var(--bg-hover)', color: 'var(--text-secondary)' },
    pending: { bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
    completed: { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
    cancelled: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626' },
  }

  return (
    <div className="p-8">
      <OnboardingModal />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Bem-vindo, {profile?.name}</p>
        </div>
        <Link href="/documents/new"
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ background: 'var(--blue-primary)' }}>
          <Plus size={16} /> Novo Documento
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Documentos recentes</h2>
          <Link href="/documents" className="text-sm hover:underline" style={{ color: 'var(--blue-primary)' }}>Ver todos</Link>
        </div>
        {!recentDocs?.length ? (
          <div className="px-5 py-12 text-center">
            <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhum documento criado ainda.</p>
            <Link href="/documents/new" className="inline-flex items-center gap-1.5 mt-3 text-sm hover:underline" style={{ color: 'var(--blue-primary)' }}>
              <Plus size={14} /> Criar primeiro documento
            </Link>
          </div>
        ) : (
          <div>
            {recentDocs.map((doc: any) => {
              const signed = doc.signatories?.filter((s: any) => s.status === 'signed').length ?? 0
              const total = doc.signatories?.length ?? 0
              const sc = statusColors[doc.status] ?? statusColors.draft
              return (
                <Link key={doc.id} href={`/documents/${doc.id}`}
                  className="flex items-center justify-between px-5 py-3.5 border-b last:border-0 transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ borderColor: 'var(--border)', color: 'inherit' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--blue-light)' }}>
                      <FileText size={14} style={{ color: 'var(--blue-primary)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{doc.title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(doc.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {total > 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{signed}/{total} assinaturas</span>}
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: sc.bg, color: sc.color }}>
                      {documentStatusLabel(doc.status)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
