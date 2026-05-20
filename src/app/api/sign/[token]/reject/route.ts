import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { reason } = await req.json()

  const supabase = getAdmin()

  const { data: sig } = await supabase
    .from('signatories')
    .select('id, document_id, status')
    .eq('token', token)
    .single()

  if (!sig) return NextResponse.json({ error: 'Signatário não encontrado' }, { status: 404 })
  if (sig.status === 'signed') return NextResponse.json({ error: 'Já assinado' }, { status: 409 })

  await supabase.from('signatories').update({
    status: 'rejected',
    rejection_reason: reason ?? '',
  }).eq('id', sig.id)

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  await supabase.from('audit_events').insert({
    document_id: sig.document_id,
    signatory_id: sig.id,
    event_type: 'rejected',
    ip_address: ip,
    metadata: { reason },
  })

  return NextResponse.json({ ok: true })
}
