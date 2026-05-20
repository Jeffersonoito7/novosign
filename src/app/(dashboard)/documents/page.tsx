import { createClient } from '@/lib/supabase/server'
import { FileText, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { documentStatusLabel, formatDate } from '@/lib/utils'
import type { Document } from '@/types'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  const { data: documents } = await supabase
    .from('documents')
    .select('*, signatories(id, status, name)')
    .eq('company_id', profile?.company_id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-500 text-sm mt-1">{documents?.length ?? 0} documento(s)</p>
        </div>
        <Link
          href="/documents/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Novo Documento
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {!documents?.length ? (
          <div className="py-16 text-center">
            <FileText size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhum documento ainda</p>
            <p className="text-gray-400 text-sm mt-1">Clique em "Novo Documento" para começar</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Signatários</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc: any) => {
                const signed = doc.signatories?.filter((s: any) => s.status === 'signed').length ?? 0
                const total = doc.signatories?.length ?? 0
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-5 py-4">
                      <Link href={`/documents/${doc.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                          <FileText size={14} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 hover:text-blue-600">{doc.title}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{doc.id.slice(0, 8)}...</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-5 py-4">
                      {total > 0 ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-24">
                              <div
                                className="bg-green-500 rounded-full h-1.5"
                                style={{ width: `${total > 0 ? (signed / total) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{signed}/{total}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sem signatários</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{formatDate(doc.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {documentStatusLabel(status)}
    </span>
  )
}
