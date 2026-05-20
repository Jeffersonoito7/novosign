import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { ReactElement } from 'react'
import Image from 'next/image'
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
    <div className="min-h-screen transition-colors" style={{ background: 'var(--bg)' }}>
      <header className="border-b px-6 py-4 transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Image src="/logo.svg" alt="NovoSign" width={28} height={28} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--blue-primary)' }}>NovoSign</h1>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Verificador de Autenticidade</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {!data.valid ? (
          <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: '#fecaca' }}>
            <XCircle size={48} className="mx-auto mb-4" style={{ color: '#ef4444' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Documento não encontrado</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              O hash informado não corresponde a nenhum documento assinado em nossa plataforma.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status */}
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'rgba(16,185,129,0.3)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
                  <Shield size={24} style={{ color: '#10b981' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#10b981' }}>Documento autêntico</p>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.document!.title}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Empresa', value: data.document!.company },
                  { label: 'Criado em', value: formatDate(data.document!.created_at) },
                  { label: 'Status', value: 'Concluído' },
                  { label: 'Validade jurídica', value: 'Lei 14.063/2020' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hash */}
            <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Integridade do documento</h3>
              <div className="text-xs">
                <p className="mb-1" style={{ color: 'var(--text-muted)' }}>Hash do documento assinado (SHA-256)</p>
                <p className="font-mono break-all px-3 py-2 rounded-lg" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                  {data.document!.signed_file_hash}
                </p>
              </div>
            </div>

            {/* Signatários */}
            <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Signatários</h3>
              </div>
              <div>
                {data.signatories?.map((sig, i) => (
                  <div key={i} className="px-5 py-4 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {sigStatusIcon[sig.status] ?? <Clock size={16} style={{ color: 'var(--text-muted)' }} />}
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{sig.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sig.email}</p>
                          {sig.cpf && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>CPF: {sig.cpf}</p>}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ background: sig.status === 'signed' ? 'rgba(16,185,129,0.1)' : 'var(--bg-hover)', color: sig.status === 'signed' ? '#10b981' : 'var(--text-muted)' }}>
                        {sig.status === 'signed' ? 'Assinado' : sig.status}
                      </span>
                    </div>
                    {sig.status === 'signed' && sig.signed_at && (
                      <div className="ml-7 mt-2 text-xs space-y-0.5" style={{ color: 'var(--text-muted)' }}>
                        <p>Assinado em: {formatDate(sig.signed_at)}</p>
                        {sig.ip_address && <p>IP: {sig.ip_address}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-xs py-2" style={{ color: 'var(--text-muted)' }}>
              Este documento foi assinado eletronicamente via NovoSign.<br />
              Conforme a Lei nº 14.063/2020 e a Medida Provisória 2.200-2/2001.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
