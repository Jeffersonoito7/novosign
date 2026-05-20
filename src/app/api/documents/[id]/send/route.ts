import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendSignatureRequestEmail } from '@/lib/notifications/email'
import { sendSignatureRequestWhatsApp } from '@/lib/notifications/whatsapp'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = getAdmin()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await admin.from('users').select('name, company_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 401 })

  const { data: doc } = await admin
    .from('documents')
    .select('*, signatories(*)')
    .eq('id', id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
  if (doc.company_id !== profile.company_id) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  if (doc.status !== 'draft') return NextResponse.json({ error: 'Documento já enviado' }, { status: 400 })

  // Verificar créditos
  const { data: company } = await admin
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
  await admin.from('companies').update({ credits: newBalance }).eq('id', profile.company_id)

  await admin.from('credit_transactions').insert({
    company_id: profile.company_id,
    type: 'usage',
    credits: 1,
    balance_after: newBalance,
    description: `Envio do documento: ${doc.title}`,
    document_id: id,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://novosign.com.br'

  await admin.from('documents').update({ status: 'pending' }).eq('id', id)

  const signatories = doc.signatories ?? []
  const emailErrors: string[] = []

  for (const sig of signatories) {
    const signUrl = `${appUrl}/sign/${sig.token}`

    if (sig.notification_channel === 'email') {
      try {
        const result = await sendSignatureRequestEmail({
          to: sig.email,
          signatoryName: sig.name,
          documentTitle: doc.title,
          senderName: profile.name ?? 'NovoSign',
          signUrl,
          message: doc.message,
          expiresAt: doc.expires_at,
        })
        console.log('Email enviado:', JSON.stringify(result))
      } catch (err: any) {
        console.error('Erro ao enviar email:', err?.message ?? err)
        emailErrors.push(err?.message ?? 'Erro desconhecido')
      }
    } else if (sig.notification_channel === 'whatsapp' && sig.phone) {
      try {
        await sendSignatureRequestWhatsApp({
          phone: sig.phone,
          signatoryName: sig.name,
          documentTitle: doc.title,
          senderName: profile.name ?? 'NovoSign',
          signUrl,
        })
      } catch (err: any) {
        console.error('Erro ao enviar WhatsApp:', err?.message ?? err)
      }
    }

    await admin.from('audit_events').insert({
      document_id: id,
      signatory_id: sig.id,
      event_type: 'document_sent',
      metadata: { channel: sig.notification_channel, email: sig.email, sign_url: signUrl },
    })
  }

  await admin.from('audit_events').insert({
    document_id: id,
    event_type: 'document_sent',
    metadata: { total_signatories: signatories.length },
  })

  return NextResponse.json({
    ok: true,
    emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
  })
}
