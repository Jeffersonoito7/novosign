import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendOTPEmail } from '@/lib/notifications/email'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = getAdmin()

    const { data: sig, error } = await supabase
      .from('signatories')
      .select('id, name, email, phone, status, document_id, notification_channel')
      .eq('token', token)
      .single()

    if (error || !sig) {
      return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 })
    }

    if (sig.status === 'signed') {
      return NextResponse.json({ error: 'Documento já assinado por este assinante' }, { status: 409 })
    }

    const { data: doc } = await supabase
      .from('documents')
      .select('id, title, status, expires_at, company_id')
      .eq('id', sig.document_id)
      .single()

    if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    if (doc.status === 'cancelled') return NextResponse.json({ error: 'Este documento foi cancelado' }, { status: 410 })
    if (doc.status === 'completed') return NextResponse.json({ error: 'Este documento já foi concluído' }, { status: 410 })
    if (doc.expires_at && new Date(doc.expires_at) < new Date()) {
      return NextResponse.json({ error: 'O prazo para assinar este documento expirou' }, { status: 410 })
    }

    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    const userAgent = req.headers.get('user-agent') ?? ''

    await supabase.from('audit_events').insert({
      document_id: sig.document_id,
      signatory_id: sig.id,
      event_type: 'viewed',
      ip_address: ip,
      user_agent: userAgent,
    })

    if (sig.status === 'pending') {
      await supabase.from('signatories').update({ status: 'viewed' }).eq('id', sig.id)
    }

    // Gerar OTP e salvar
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: otpError } = await supabase.from('verification_codes').insert({
      signatory_id: sig.id,
      code,
      channel: sig.notification_channel ?? 'email',
      expires_at: expiresAt,
    })

    if (otpError) {
      console.error('Erro ao salvar OTP:', otpError)
      return NextResponse.json({ error: 'Erro ao gerar código de verificação' }, { status: 500 })
    }

    await supabase.from('audit_events').insert({
      document_id: sig.document_id,
      signatory_id: sig.id,
      event_type: 'code_sent',
      ip_address: ip,
      metadata: { channel: sig.notification_channel ?? 'email' },
    })

    const channel = sig.notification_channel ?? 'email'

    if (channel === 'email') {
      try {
        const result = await sendOTPEmail({
          to: sig.email,
          signatoryName: sig.name,
          code,
          documentTitle: doc.title,
        })
        console.log('OTP email enviado:', JSON.stringify(result))
      } catch (emailErr: any) {
        console.error('Erro ao enviar OTP email:', emailErr?.message ?? emailErr)
      }
    } else if (channel === 'whatsapp' && sig.phone) {
      try {
        const { sendOTPWhatsApp } = await import('@/lib/notifications/whatsapp')
        await sendOTPWhatsApp({
          phone: sig.phone,
          signatoryName: sig.name,
          code,
          documentTitle: doc.title,
        })
      } catch (waErr: any) {
        console.error('Erro ao enviar OTP WhatsApp:', waErr?.message ?? waErr)
      }
    }

    return NextResponse.json({
      ok: true,
      signatory: {
        name: sig.name,
        email: sig.email,
        channel,
      },
      document: {
        title: doc.title,
      },
    })
  } catch (err) {
    console.error('Erro na rota GET /api/sign/[token]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
