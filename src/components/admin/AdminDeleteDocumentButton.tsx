'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminDeleteDocumentButton({ documentId, title }: { documentId: string; title: string }) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/admin/documents/${documentId}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) {
      setConfirm(false)
      router.refresh()
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Confirmar?</span>
        <button onClick={handleDelete} disabled={loading}
          className="text-xs px-2 py-0.5 rounded font-medium text-white bg-red-600 disabled:opacity-50">
          {loading ? '...' : 'Sim'}
        </button>
        <button onClick={() => setConfirm(false)}
          className="text-xs px-2 py-0.5 rounded font-medium"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
          Não
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirm(true)}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
      style={{ background: '#fee2e2', color: '#dc2626' }}>
      <Trash2 size={12} /> Excluir
    </button>
  )
}
