import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generateOTPCode } from '@/lib/crypto'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = getAdmin()

    const { data: sig, error: sigError } = await supabase
      .from('signatories')
      .select('id, document_id, name, email, phone, status, notification_channel, token')
      .eq('token', token)
      .single()

    if (sigError) return NextResponse.json({ error: 'DB: ' + sigError.message }, { status: 500 })
    if (!sig) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
    if (sig.status === 'signed') return NextResponse.json({ error: 'Já assinado' }, { status: 409 })

    // Buscar documento separadamente
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, title, message, file_hash')
      .eq('id', sig.document_id)
      .single()

    if (docError || !doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })

    // Registrar visualização
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    if (sig.status === 'pending') {
      await supabase.from('signatories').update({ status: 'viewed' }).eq('id', sig.id)
      await supabase.from('audit_events').insert({
        document_id: sig.document_id,
        signatory_id: sig.id,
        event_type: 'document_viewed',
        ip_address: ip,
        user_agent: req.headers.get('user-agent') ?? '',
      })
    }

    // Gerar OTP
    const code = generateOTPCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase.from('verification_codes').insert({
      signatory_id: sig.id,
      code,
      channel: sig.notification_channel,
      expires_at: expiresAt,
    })

    // Enviar OTP — import dinâmico para não quebrar o módulo
    try {
      if (sig.notification_channel === 'email') {
        const { sendOTPEmail } = await import('@/lib/notifications/email')
        await sendOTPEmail({ to: sig.email, signatoryName: sig.name, code, documentTitle: doc.title })
      } else if (sig.notification_channel === 'whatsapp' && sig.phone) {
        const { sendOTPWhatsApp } = await import('@/lib/notifications/whatsapp')
        await sendOTPWhatsApp({ phone: sig.phone, signatoryName: sig.name, code, documentTitle: doc.title })
      }
    } catch (notifErr) {
      console.error('Erro ao enviar OTP:', notifErr)
    }

    await supabase.from('audit_events').insert({
      document_id: sig.document_id,
      signatory_id: sig.id,
      event_type: 'code_sent',
      metadata: { channel: sig.notification_channel },
    })

    return NextResponse.json({
      signatory: { id: sig.id, name: sig.name, email: sig.email, notification_channel: sig.notification_channel },
      document: { title: doc.title, message: doc.message, file_hash: doc.file_hash },
    })

  } catch (err: any) {
    console.error('Sign route fatal error:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro interno' }, { status: 500 })
  }
}
