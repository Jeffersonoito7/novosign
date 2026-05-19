import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate, documentStatusLabel, signatoryStatusLabel } from '@/lib/utils'
import { FileText, Clock, CheckCircle, XCircle, Send, Download, Shield, type LucideIcon } from 'lucide-react'
import type { ReactElement } from 'react'
import SendButton from './SendButton'
import Link from 'next/link'

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documents')
    .select('*, signatories(*), audit_events(*)')
    .eq('id', id)
    .single()

  if (!doc) notFound()

  const signatories = doc.signatories ?? []
  const audit = (doc.audit_events ?? []).sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const signed = signatories.filter((s: any) => s.status === 'signed').length
  const total = signatories.length

  const statusIcon: Record<string, ReactElement> = {
    draft: <Clock size={16} className="text-gray-500" />,
    pending: <Clock size={16} className="text-yellow-500" />,
    completed: <CheckCircle size={16} className="text-green-500" />,
    cancelled: <XCircle size={16} className="text-red-500" />,
  }

  const sigStatusColor: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    viewed: 'bg-blue-50 text-blue-600',
    signed: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
  }

  const auditLabel: Record<string, string> = {
    document_created: 'Documento criado',
    document_sent: 'Documento enviado para assinatura',
    document_viewed: 'Documento visualizado',
    code_sent: 'Código de verificação enviado',
    code_verified: 'Identidade verificada',
    signed: 'Documento assinado',
    rejected: 'Assinatura recusada',
    completed: 'Documento concluído',
    cancelled: 'Documento cancelado',
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link href="/dashboard/documents" className="hover:text-blue-600">Documentos</Link>
            <span>/</span>
            <span className="text-gray-600">{doc.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            {statusIcon[doc.status]}
            <span className="text-sm text-gray-600">{documentStatusLabel(doc.status)}</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-400">Criado {formatDate(doc.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {doc.signed_file_path && (
            <a
              href={`/api/documents/${doc.id}/pdf`}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Baixar PDF
            </a>
          )}
          {doc.signed_file_hash && (
            <Link
              href={`/verify/${doc.signed_file_hash}`}
              className="flex items-center gap-2 border border-green-300 text-green-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
              target="_blank"
            >
              <Shield size={16} />
              Verificar
            </Link>
          )}
          {doc.status === 'draft' && (
            <SendButton documentId={doc.id} appUrl={appUrl} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Signatários */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Signatários</h2>
              {total > 0 && (
                <span className="text-sm text-gray-500">{signed}/{total} assinado(s)</span>
              )}
            </div>

            {total === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                Nenhum signatário definido
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {signatories
                  .sort((a: any, b: any) => a.sign_order - b.sign_order)
                  .map((sig: any) => (
                    <div key={sig.id} className="px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                            {sig.sign_order}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{sig.name}</p>
                            <p className="text-xs text-gray-400">{sig.email}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sigStatusColor[sig.status]}`}>
                          {signatoryStatusLabel(sig.status)}
                        </span>
                      </div>

                      {sig.status === 'signed' && sig.signed_at && (
                        <div className="mt-2 ml-11 text-xs text-gray-400 space-y-0.5">
                          <p>Assinado em {formatDate(sig.signed_at)}</p>
                          {sig.ip_address && <p>IP: {sig.ip_address}</p>}
                          {sig.cpf && <p>CPF: {sig.cpf}</p>}
                        </div>
                      )}

                      {sig.status === 'rejected' && sig.rejection_reason && (
                        <div className="mt-2 ml-11 text-xs text-red-500">
                          Motivo: {sig.rejection_reason}
                        </div>
                      )}

                      {(doc.status === 'pending' || doc.status === 'draft') && sig.status === 'pending' && (
                        <div className="mt-2 ml-11">
                          <a
                            href={`${appUrl}/sign/${sig.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Link de assinatura →
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Hash do documento */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield size={16} className="text-blue-600" /> Segurança
            </h2>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-500">Hash original (SHA-256):</span>
                <p className="font-mono text-gray-700 mt-0.5 break-all">{doc.file_hash}</p>
              </div>
              {doc.signed_file_hash && (
                <div className="mt-2">
                  <span className="text-gray-500">Hash do documento assinado:</span>
                  <p className="font-mono text-gray-700 mt-0.5 break-all">{doc.signed_file_hash}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trilha de auditoria */}
        <div className="bg-white border border-gray-200 rounded-xl h-fit">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Auditoria</h2>
          </div>
          <div className="px-5 py-4">
            {audit.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum evento registrado.</p>
            ) : (
              <ol className="relative border-l border-gray-200 space-y-4 ml-2">
                {audit.map((event: any) => (
                  <li key={event.id} className="ml-4">
                    <div className="absolute w-2.5 h-2.5 bg-blue-400 rounded-full -left-1.5 border border-white mt-1" />
                    <p className="text-xs font-medium text-gray-700">{auditLabel[event.event_type] ?? event.event_type}</p>
                    <p className="text-xs text-gray-400">{formatDate(event.created_at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
