import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { ReactElement } from 'react'
import { formatDate } from '@/lib/utils'

interface VerifyData {
  valid: boolean
  document?: {
    id: string
    title: string
    status: string
    file_hash: string
    signed_file_hash: string
    created_at: string
    company: string
  }
  signatories?: {
    name: string
    email: string
    cpf?: string
    status: string
    signed_at?: string
    ip_address?: string
  }[]
  error?: string
}

async function getVerifyData(hash: string): Promise<VerifyData> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${appUrl}/api/verify/${hash}`, { cache: 'no-store' })
  return res.json()
}

export default async function VerifyPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params
  const data = await getVerifyData(hash)

  const sigStatusIcon: Record<string, ReactElement> = {
    signed: <CheckCircle size={16} className="text-green-500" />,
    pending: <Clock size={16} className="text-yellow-500" />,
    rejected: <XCircle size={16} className="text-red-500" />,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <h1 className="text-xl font-bold text-blue-600">NovoSign</h1>
          <span className="text-sm text-gray-400">Verificador de Autenticidade</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {!data.valid ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Documento não encontrado</h2>
            <p className="text-gray-500 text-sm">
              O hash informado não corresponde a nenhum documento assinado em nossa plataforma.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status */}
            <div className="bg-white rounded-2xl border border-green-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <Shield size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600">Documento autêntico</p>
                  <h2 className="text-xl font-bold text-gray-900">{data.document!.title}</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Empresa</p>
                  <p className="font-medium text-gray-900">{data.document!.company}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Criado em</p>
                  <p className="font-medium text-gray-900">{formatDate(data.document!.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Status</p>
                  <p className="font-medium text-green-700">Concluído</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Validade jurídica</p>
                  <p className="font-medium text-gray-900">Lei 14.063/2020</p>
                </div>
              </div>
            </div>

            {/* Hash */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Integridade do documento</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-gray-400 mb-1">Hash do documento assinado (SHA-256)</p>
                  <p className="font-mono text-gray-700 break-all bg-gray-50 px-3 py-2 rounded-lg">
                    {data.document!.signed_file_hash}
                  </p>
                </div>
              </div>
            </div>

            {/* Signatários */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Signatários</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {data.signatories?.map((sig, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {sigStatusIcon[sig.status] ?? <Clock size={16} className="text-gray-400" />}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{sig.name}</p>
                          <p className="text-xs text-gray-400">{sig.email}</p>
                          {sig.cpf && <p className="text-xs text-gray-400">CPF: {sig.cpf}</p>}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        sig.status === 'signed' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {sig.status === 'signed' ? 'Assinado' : sig.status}
                      </span>
                    </div>
                    {sig.status === 'signed' && sig.signed_at && (
                      <div className="ml-7 mt-2 text-xs text-gray-400 space-y-0.5">
                        <p>Assinado em: {formatDate(sig.signed_at)}</p>
                        {sig.ip_address && <p>IP: {sig.ip_address}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 py-2">
              Este documento foi assinado eletronicamente via NovoSign.<br />
              Conforme a Lei nº 14.063/2020 e a Medida Provisória 2.200-2/2001.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
