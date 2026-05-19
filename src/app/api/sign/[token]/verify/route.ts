import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { code } = await req.json()

  const supabase = await createClient()

  const { data: sig } = await supabase
    .from('signatories')
    .select('id, document_id, name, email, notification_channel')
    .eq('token', token)
    .single()

  if (!sig) return NextResponse.json({ error: 'Signatário não encontrado' }, { status: 404 })

  // Buscar código OTP mais recente não usado
  const { data: otpRecord } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('signatory_id', sig.id)
    .is('used_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!otpRecord) return NextResponse.json({ error: 'Código não encontrado. Solicite um novo.' }, { status: 400 })

  if (otpRecord.attempts >= 5) {
    return NextResponse.json({ error: 'Muitas tentativas. Solicite um novo código.' }, { status: 429 })
  }

  if (new Date(otpRecord.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Código expirado. Solicite um novo.' }, { status: 400 })
  }

  // Incrementar tentativas
  await supabase.from('verification_codes').update({ attempts: otpRecord.attempts + 1 }).eq('id', otpRecord.id)

  if (otpRecord.code !== code.trim()) {
    return NextResponse.json({ error: 'Código incorreto.' }, { status: 400 })
  }

  // Marcar como usado
  await supabase.from('verification_codes').update({ used_at: new Date().toISOString() }).eq('id', otpRecord.id)

  // Evento de auditoria
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  await supabase.from('audit_events').insert({
    document_id: sig.document_id,
    signatory_id: sig.id,
    event_type: 'code_verified',
    ip_address: ip,
    user_agent: req.headers.get('user-agent') ?? '',
  })

  return NextResponse.json({ ok: true, signatoryId: sig.id })
}
