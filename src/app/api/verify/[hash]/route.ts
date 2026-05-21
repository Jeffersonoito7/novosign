import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params
  const supabase = getAdmin()

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hash)

  const query = supabase
    .from('documents')
    .select('id, title, status, file_hash, signed_file_hash, created_at, companies(name)')

  const { data: doc } = await (isUUID
    ? query.eq('id', hash).single()
    : query.eq('signed_file_hash', hash).single())

  if (!doc) {
    return NextResponse.json({ valid: false, error: 'Documento não encontrado' }, { status: 404 })
  }

  const { data: signatories } = await supabase
    .from('signatories')
    .select('name, email, cpf, status, signed_at, ip_address, user_agent, geolocation, notification_channel, signature_image_path')
    .eq('document_id', doc.id)
    .order('sign_order')

  return NextResponse.json({
    valid: true,
    document: {
      id: doc.id,
      title: doc.title,
      status: doc.status,
      file_hash: doc.file_hash,
      signed_file_hash: doc.signed_file_hash,
      created_at: doc.created_at,
      company: (doc.companies as any)?.name,
    },
    signatories: (signatories ?? []).map(s => ({
      name: s.name,
      email: s.email,
      cpf: s.cpf,
      status: s.status,
      signed_at: s.signed_at,
      ip_address: s.ip_address,
      user_agent: s.user_agent,
      geolocation: s.geolocation,
      notification_channel: s.notification_channel,
    })),
  })
}
