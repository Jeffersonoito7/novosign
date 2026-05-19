import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateOTPCode } from '@/lib/crypto'
import { sendOTPEmail } from '@/lib/notifications/email'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: sig } = await supabase
    .from('signatories')
    .select('*, documents(*)')
    .eq('token', token)
    .single()

  if (!sig) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  if (sig.status === 'signed') return NextResponse.json({ error: 'Já assinado' }, { status: 409 })

  // Registrar visualização
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
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

  // Gerar e enviar código OTP
  const code = generateOTPCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await supabase.from('verification_codes').insert({
    signatory_id: sig.id,
    code,
    channel: sig.notification_channel,
    expires_at: expiresAt,
  })

  try {
    if (sig.notification_channel === 'email') {
      await sendOTPEmail({
        to: sig.email,
        signatoryName: sig.name,
        code,
        documentTitle: sig.documents.title,
      })
    }
  } catch (err) {
    console.error('Erro ao enviar OTP:', err)
  }

  await supabase.from('audit_events').insert({
    document_id: sig.document_id,
    signatory_id: sig.id,
    event_type: 'code_sent',
    metadata: { channel: sig.notification_channel },
  })

  return NextResponse.json({
    signatory: {
      id: sig.id,
      name: sig.name,
      email: sig.email,
      notification_channel: sig.notification_channel,
    },
    document: {
      title: sig.documents.title,
      message: sig.documents.message,
      file_hash: sig.documents.file_hash,
    },
  })
}
