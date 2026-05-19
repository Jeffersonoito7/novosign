'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Zap } from 'lucide-react'

export default function SendButton({ documentId, appUrl }: { documentId: string; appUrl: string }) {
  const [loading, setLoading] = useState(false)
  const [noCredits, setNoCredits] = useState(false)
  const router = useRouter()

  async function handleSend() {
    if (!confirm('Enviar documento para assinatura? 1 crédito será descontado e todos os signatários serão notificados.')) return
    setLoading(true)
    setNoCredits(false)
    const res = await fetch(`/api/documents/${documentId}/send`, { method: 'POST' })
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      if (data.code === 'NO_CREDITS') {
        setNoCredits(true)
      } else {
        alert(data.error ?? 'Erro ao enviar.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {noCredits && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
          <Zap size={13} />
          <span>Sem créditos. </span>
          <a href="/dashboard/credits" className="font-bold underline">Comprar agora →</a>
        </div>
      )}
      <button
        onClick={handleSend}
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <Send size={16} />
        {loading ? 'Enviando...' : 'Enviar para Assinatura'}
      </button>
    </div>
  )
}
