'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, X } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'signed' | 'completed'
}

export default function RealtimeToast({ companyId }: { companyId: string }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('audit-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_events',
          filter: `event_type=in.(signed,completed)`,
        },
        async (payload: any) => {
          const { event_type, document_id, signatory_id } = payload.new

          // Buscar nome do assinante e documento
          let message = ''
          if (event_type === 'signed' && signatory_id) {
            const { data: sig } = await supabase
              .from('signatories')
              .select('name, documents(title, company_id)')
              .eq('id', signatory_id)
              .single()

            const doc = sig?.documents as any
            if (doc?.company_id !== companyId) return
            message = `✍️ ${sig?.name} assinou "${doc?.title}"`
          } else if (event_type === 'completed') {
            const { data: doc } = await supabase
              .from('documents')
              .select('title, company_id')
              .eq('id', document_id)
              .single()

            if (doc?.company_id !== companyId) return
            message = `✅ "${doc?.title}" foi assinado por todos!`
          }

          if (!message) return

          const id = Date.now().toString()
          setToasts(prev => [...prev, { id, message, type: event_type }])

          // Auto-remover após 6s
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
          }, 6000)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [companyId])

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border max-w-sm animate-in slide-in-from-bottom-2"
          style={{
            background: 'var(--bg-card)',
            borderColor: toast.type === 'completed' ? 'rgba(16,185,129,0.3)' : 'var(--blue-border)',
          }}
        >
          <CheckCircle size={18} style={{ color: toast.type === 'completed' ? '#10b981' : 'var(--blue-primary)', flexShrink: 0 }} />
          <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{toast.message}</p>
          <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
