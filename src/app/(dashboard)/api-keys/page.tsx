'use client'

import { useEffect, useState } from 'react'
import { Key, Plus, Trash2, Copy, CheckCircle, AlertTriangle, Globe } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  active: boolean
  last_used_at?: string
  created_at: string
}

interface Webhook {
  id: string
  url: string
  events: string[]
  active: boolean
  created_at: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchKeys()
    fetchWebhooks()
  }, [])

  async function fetchKeys() {
    const res = await fetch('/api/v1/keys')
    const data = await res.json()
    setKeys(data.keys ?? [])
  }

  async function fetchWebhooks() {
    const res = await fetch('/api/v1/webhooks')
    const data = await res.json()
    setWebhooks(data.webhooks ?? [])
  }

  async function createKey(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyName.trim()) return
    setLoading(true)
    const res = await fetch('/api/v1/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() }),
    })
    const data = await res.json()
    if (data.key) {
      setRevealedKey(data.key)
      setNewKeyName('')
      fetchKeys()
    } else {
      alert(data.error ?? 'Erro ao criar chave.')
    }
    setLoading(false)
  }

  async function revokeKey(id: string) {
    if (!confirm('Revogar esta API Key? Sistemas que a usam perderão acesso.')) return
    await fetch('/api/v1/keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchKeys()
  }

  async function createWebhook(e: React.FormEvent) {
    e.preventDefault()
    if (!webhookUrl.trim()) return
    setLoading(true)
    const res = await fetch('/api/v1/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      alert(`Webhook criado!\nSecret para validar: ${data.secret}\n\nGuarde esse secret agora, ele não será exibido novamente.`)
      setWebhookUrl('')
      fetchWebhooks()
    } else {
      alert(data.error ?? 'Erro ao criar webhook.')
    }
    setLoading(false)
  }

  async function deleteWebhook(id: string) {
    if (!confirm('Remover este webhook?')) return
    await fetch('/api/v1/webhooks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchWebhooks()
  }

  async function copyKey() {
    if (!revealedKey) return
    await navigator.clipboard.writeText(revealedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">API & Integrações</h1>
      <p className="text-gray-500 text-sm mb-8">
        Integre o NovoSign ao UNIAVP e outros sistemas via API REST.
      </p>

      {/* Chave revelada */}
      {revealedKey && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 mb-2">Copie sua chave agora — ela não será exibida novamente!</p>
              <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
                <code className="flex-1 text-sm font-mono text-gray-800 break-all">{revealedKey}</code>
                <button
                  onClick={copyKey}
                  className="shrink-0 text-amber-600 hover:text-amber-800"
                >
                  {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
              </div>
              <button
                onClick={() => setRevealedKey(null)}
                className="mt-3 text-xs text-amber-600 hover:underline"
              >
                Já copiei, pode esconder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys */}
      <div className="bg-white border border-gray-200 rounded-xl mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Key size={16} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">API Keys</h2>
        </div>

        <div className="p-5">
          <form onSubmit={createKey} className="flex gap-3 mb-5">
            <input
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="Nome da chave (ex: UNIAVP Produção)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !newKeyName.trim()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <Plus size={15} /> Criar chave
            </button>
          </form>

          {keys.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma API Key criada ainda.</p>
          ) : (
            <div className="space-y-2">
              {keys.map(k => (
                <div key={k.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key size={14} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{k.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{k.key_prefix}••••••••••••••••</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {k.last_used_at && <span>Último uso: {formatDate(k.last_used_at)}</span>}
                    <span className={`px-2 py-0.5 rounded-full font-medium ${k.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {k.active ? 'Ativa' : 'Revogada'}
                    </span>
                    {k.active && (
                      <button onClick={() => revokeKey(k.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white border border-gray-200 rounded-xl mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Globe size={16} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">Webhooks</h2>
        </div>

        <div className="p-5">
          <form onSubmit={createWebhook} className="flex gap-3 mb-5">
            <input
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://uniavp.com.br/api/novosign/webhook"
              type="url"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !webhookUrl.trim()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <Plus size={15} /> Adicionar
            </button>
          </form>

          {webhooks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum webhook configurado.</p>
          ) : (
            <div className="space-y-2">
              {webhooks.map(h => (
                <div key={h.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800 font-mono">{h.url}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Eventos: {h.events.join(', ')}</p>
                  </div>
                  <button onClick={() => deleteWebhook(h.id)} className="text-red-400 hover:text-red-600 ml-4">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Documentação rápida */}
      <div className="bg-gray-900 rounded-xl p-6 text-green-400 font-mono text-sm">
        <p className="text-gray-400 text-xs mb-4"># Exemplo de integração — UNIAVP enviando contrato de matrícula</p>
        <pre className="whitespace-pre-wrap break-all leading-6">{`curl -X POST https://novosign.com.br/api/v1/envelope \\
  -H "Authorization: Bearer ns_live_SUA_CHAVE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Contrato de Matrícula — João Silva",
    "file_url": "https://uniavp.com.br/contratos/joao.pdf",
    "signatories": [
      {
        "name": "João Silva",
        "email": "joao@email.com",
        "cpf": "000.000.000-00",
        "notification_channel": "email"
      }
    ],
    "metadata": { "aluno_id": "12345", "turma": "MBA-2026" }
  }'`}</pre>
        <p className="text-gray-500 text-xs mt-4 font-sans">{`→ Resposta: { "id": "uuid", "status": "pending", "signatories": [...] }`}</p>
      </div>
    </div>
  )
}
