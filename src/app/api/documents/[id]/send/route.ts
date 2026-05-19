import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSignatureRequestEmail } from '@/lib/notifications/email'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('name, company_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 401 })

  const { data: doc } = await supabase
    .from('documents')
    .select('*, signatories(*)')
    .eq('id', id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
  if (doc.company_id !== profile?.company_id) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  if (doc.status !== 'draft') return NextResponse.json({ error: 'Documento já enviado' }, { status: 400 })

  // Verificar e descontar crédito
  const { data: company } = await supabase
    .from('companies')
    .select('credits')
    .eq('id', profile.company_id)
    .single()

  if (!company || company.credits < 1) {
    return NextResponse.json(
      { error: 'Saldo insuficiente. Compre créditos para enviar documentos.', code: 'NO_CREDITS' },
      { status: 402 }
    )
  }

  const newBalance = company.credits - 1
  await supabase.from('companies').update({ credits: newBalance }).eq('id', profile.company_id)

  // Registrar transação de débito
  await supabase.from('credit_transactions').insert({
    company_id: profile.company_id,
    type: 'deduction',
    credits: -1,
    balance_after: newBalance,
    description: `Envio do documento: ${doc.title}`,
    document_id: id,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Atualizar status do documento
  await supabase.from('documents').update({ status: 'pending' }).eq('id', id)

  // Enviar notificação para cada signatário
  const signatories = doc.signatories ?? []
  for (const sig of signatories) {
    const signUrl = `${appUrl}/sign/${sig.token}`

    try {
      if (sig.notification_channel === 'email') {
        await sendSignatureRequestEmail({
          to: sig.email,
          signatoryName: sig.name,
          documentTitle: doc.title,
          senderName: profile?.name ?? 'Alguém',
          signUrl,
          message: doc.message,
          expiresAt: doc.expires_at,
        })
      }
      // WhatsApp e SMS serão implementados na Fase 2
    } catch (err) {
      console.error('Erro ao notificar signatário:', err)
    }

    // Evento de auditoria
    await supabase.from('audit_events').insert({
      document_id: id,
      signatory_id: sig.id,
      event_type: 'document_sent',
      metadata: { channel: sig.notification_channel, email: sig.email },
    })
  }

  // Evento global de envio
  await supabase.from('audit_events').insert({
    document_id: id,
    event_type: 'document_sent',
    metadata: { total_signatories: signatories.length },
  })

  return NextResponse.json({ ok: true })
}
