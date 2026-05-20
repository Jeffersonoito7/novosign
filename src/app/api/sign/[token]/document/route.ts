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
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = getAdmin()

  const { data: sig } = await supabase
    .from('signatories')
    .select('status, documents(file_path, title)')
    .eq('token', token)
    .single()

  if (!sig) return NextResponse.json({ error: 'Inválido' }, { status: 404 })

  const doc = sig.documents as any

  // Gerar URL assinada válida por 10 minutos
  const { data: signedUrl } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.file_path, 600)

  if (!signedUrl) return NextResponse.json({ error: 'Erro ao gerar URL' }, { status: 500 })

  return NextResponse.json({ url: signedUrl.signedUrl, title: doc.title })
}
