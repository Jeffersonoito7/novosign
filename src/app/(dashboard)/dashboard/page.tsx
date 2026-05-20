import { createClient } from '@/lib/supabase/server'
import { FileText, Clock, CheckCircle, XCircle, Plus } from 'lucide-react'
import Link from 'next/link'
import { documentStatusLabel, formatDate } from '@/lib/utils'
import type { Document } from '@/types'

async function getStats(companyId: string) {
  const supabase = await createClient()

  const [total, pending, completed, cancelled] = await Promise.all([
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending'),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'completed'),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'cancelled'),
  ])

  return {
    total: total.count ?? 0,
    pending: pending.count ?? 0,
    completed: completed.count ?? 0,
    cancelled: cancelled.count ?? 0,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*, companies(*)')
    .eq('id', user!.id)
    .single()

  const stats = await getStats(profile?.company_id)

  const { data: recentDocs } = await supabase
    .from('documents')
    .select('*, signatories(id, status)')
    .eq('company_id', profile?.company_id)
    .order('created_at', { ascending: false })
    .limit(5)

  const statCards = [
    { label: 'Total de documentos', value: stats.total, icon: FileText, color: 'blue' },
    { label: 'Aguardando assinatura', value: stats.pending, icon: Clock, color: 'yellow' },
    { label: 'Concluídos', value: stats.completed, icon: CheckCircle, color: 'green' },
    { label: 'Cancelados', value: stats.cancelled, icon: XCircle, color: 'red' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Bem-vindo, {profile?.name}</p>
        </div>
        <Link
          href="/documents/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Novo Documento
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Documentos recentes */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Documentos recentes</h2>
          <Link href="/documents" className="text-sm text-blue-600 hover:underline">
            Ver todos
          </Link>
        </div>

        {!recentDocs?.length ? (
          <div className="px-5 py-12 text-center">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum documento criado ainda.</p>
            <Link
              href="/documents/new"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 hover:underline"
            >
              <Plus size={14} /> Criar primeiro documento
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentDocs.map((doc: Document & { signatories: { id: string; status: string }[] }) => {
              const signed = doc.signatories?.filter(s => s.status === 'signed').length ?? 0
              const total = doc.signatories?.length ?? 0
              return (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FileText size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(doc.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {total > 0 && (
                      <span className="text-xs text-gray-500">{signed}/{total} assinaturas</span>
                    )}
                    <StatusBadge status={doc.status} />
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-50 text-yellow-700',
    completed: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {documentStatusLabel(status)}
    </span>
  )
}
