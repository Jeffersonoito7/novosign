import { Shield, CheckCircle, XCircle, Clock, FileText, Lock, MapPin, Monitor, Hash } from 'lucide-react'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface Signatory {
  name: string
  email: string
  cpf?: string
  status: string
  signed_at?: string
  ip_address?: string
  user_agent?: string
  geolocation?: { lat: number; lng: number; city?: string; country?: string }
  notification_channel?: string
}

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
  signatories?: Signatory[]
  error?: string
}

async function getVerifyData(hash: string): Promise<VerifyData> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://novosign.com.br'
  const res = await fetch(`${appUrl}/api/verify/${hash}`, { cache: 'no-store' })
  return res.json()
}

export default async function VerifyPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params
  const data = await getVerifyData(hash)

  const allSigned = data.signatories?.every(s => s.status === 'signed')

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f8' }}>

      {/* Header */}
      <header style={{ background: '#1e3a8a' }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/novosign.png" alt="NovoSign" width={110} height={36}
              style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Lock size={13} className="text-white" />
            <span className="text-white text-xs font-medium">Verificador Oficial</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {!data.valid ? (
          <div className="bg-white rounded-2xl border border-red-200 p-10 text-center shadow-sm">
            <XCircle size={56} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Documento não encontrado</h2>
            <p className="text-gray-500 text-sm">
              O código informado não corresponde a nenhum documento assinado na plataforma NovoSign.
            </p>
          </div>
        ) : (
          <>
            {/* Status principal */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-green-200">
              <div style={{ background: allSigned ? '#059669' : '#d97706' }} className="px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                    <Shield size={28} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-0.5">
                      {allSigned ? 'DOCUMENTO AUTÊNTICO E VÁLIDO' : 'DOCUMENTO EM PROCESSO DE ASSINATURA'}
                    </p>
                    <h2 className="text-white text-xl font-bold">{data.document!.title}</h2>
                    <p className="text-white/70 text-xs mt-1">{data.document!.company}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Empresa', value: data.document!.company },
                  { label: 'Criado em', value: formatDate(data.document!.created_at) },
                  { label: 'Signatários', value: `${data.signatories?.filter(s => s.status === 'signed').length}/${data.signatories?.length}` },
                  { label: 'Status', value: allSigned ? 'Concluído' : 'Pendente' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Validade Jurídica — DESTAQUE */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-blue-100" style={{ background: '#eff6ff' }}>
                <div className="flex items-center gap-2">
                  <Shield size={16} style={{ color: '#1d4ed8' }} />
                  <h3 className="font-bold text-sm" style={{ color: '#1d4ed8' }}>VALIDADE JURÍDICA</h3>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#eff6ff' }}>
                  <CheckCircle size={18} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-blue-900 text-sm">Lei nº 14.063/2020</p>
                    <p className="text-blue-700 text-xs mt-0.5">Uso de Assinaturas Eletrônicas em Interações com Entes Públicos e em Outras Situações Especificadas. Esta lei reconhece a <strong>Assinatura Eletrônica Avançada</strong> como instrumento de manifestação de vontade com plena validade jurídica entre particulares.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#f0fdf4' }}>
                  <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-green-900 text-sm">Medida Provisória nº 2.200-2/2001</p>
                    <p className="text-green-700 text-xs mt-0.5">Institui a Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil). O Art. 10, §2º reconhece que documentos eletrônicos com <strong>identificação de autoria</strong> — mesmo fora da ICP-Brasil — têm valor probante entre as partes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#fefce8' }}>
                  <CheckCircle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-yellow-900 text-sm">Código Civil Brasileiro — Art. 107</p>
                    <p className="text-yellow-700 text-xs mt-0.5">"A validade da declaração de vontade não dependerá de forma especial, senão quando a lei expressamente a exigir." Contratos privados assinados eletronicamente são plenamente válidos.</p>
                  </div>
                </div>
                <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong>Critérios atendidos para Assinatura Eletrônica Avançada:</strong> verificação de identidade por código OTP enviado ao canal cadastrado do signatário, captura de endereço IP, data/hora UTC e dispositivo, hash SHA-256 do documento original e do documento assinado, trilha de auditoria imutável registrada no banco de dados.
                  </p>
                </div>
              </div>
            </div>

            {/* Assinantes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <FileText size={16} className="text-gray-500" />
                <h3 className="font-semibold text-gray-800">Registro de Assinaturas</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {data.signatories?.map((sig, i) => (
                  <div key={i} className="px-5 py-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${sig.status === 'signed' ? 'bg-green-500' : 'bg-gray-300'}`}>
                          {sig.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{sig.name}</p>
                          <p className="text-xs text-gray-400">{sig.email}</p>
                          {sig.cpf && <p className="text-xs text-gray-400">CPF: {sig.cpf}</p>}
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${sig.status === 'signed' ? 'bg-green-100 text-green-700' : sig.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {sig.status === 'signed' ? '✓ Assinado' : sig.status === 'rejected' ? '✗ Recusado' : '⏳ Pendente'}
                      </span>
                    </div>

                    {sig.status === 'signed' && (
                      <div className="ml-12 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                          <Clock size={13} className="text-gray-400 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Data e hora</p>
                            <p className="text-xs font-medium text-gray-700">{sig.signed_at ? formatDate(sig.signed_at) : '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                          <Monitor size={13} className="text-gray-400 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Endereço IP</p>
                            <p className="text-xs font-medium text-gray-700">{sig.ip_address ?? '—'}</p>
                          </div>
                        </div>
                        {sig.geolocation && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                            <MapPin size={13} className="text-gray-400 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400">Localização</p>
                              <p className="text-xs font-medium text-gray-700">
                                {sig.geolocation.city ? `${sig.geolocation.city}, ${sig.geolocation.country}` : `${sig.geolocation.lat?.toFixed(4)}, ${sig.geolocation.lng?.toFixed(4)}`}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                          <Shield size={13} className="text-gray-400 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Verificação</p>
                            <p className="text-xs font-medium text-gray-700">OTP via {sig.notification_channel === 'email' ? 'E-mail' : sig.notification_channel === 'whatsapp' ? 'WhatsApp' : sig.notification_channel ?? 'E-mail'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Integridade */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Hash size={16} className="text-gray-500" />
                <h3 className="font-semibold text-gray-800">Integridade do Documento</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">ID do Documento</p>
                  <p className="text-xs font-mono bg-gray-50 px-3 py-2 rounded-lg text-gray-600 break-all">{data.document!.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Hash SHA-256 — Documento Original</p>
                  <p className="text-xs font-mono bg-gray-50 px-3 py-2 rounded-lg text-gray-600 break-all">{data.document!.file_hash}</p>
                </div>
                {data.document!.signed_file_hash && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Hash SHA-256 — Documento Assinado</p>
                    <p className="text-xs font-mono bg-green-50 px-3 py-2 rounded-lg text-green-700 break-all">{data.document!.signed_file_hash}</p>
                  </div>
                )}
                <p className="text-xs text-gray-400 leading-relaxed">
                  O hash SHA-256 é uma impressão digital única do arquivo. Qualquer alteração no documento, mesmo mínima, geraria um hash completamente diferente, comprovando a integridade do arquivo.
                </p>
              </div>
            </div>

            {/* Rodapé */}
            <div className="text-center py-4 space-y-1">
              <p className="text-xs text-gray-400">
                Verificação realizada em <strong>novosign.com.br</strong> — Plataforma de Assinatura Eletrônica
              </p>
              <p className="text-xs text-gray-400">
                Lei nº 14.063/2020 · MP 2.200-2/2001 · Código Civil Art. 107
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
