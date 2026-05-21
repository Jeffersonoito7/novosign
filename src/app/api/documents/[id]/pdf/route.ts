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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getAdmin()

  const { data: doc } = await supabase
    .from('documents')
    .select('signed_file_path, file_path, title, status')
    .eq('id', id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })

  const filePath = doc.signed_file_path ?? doc.file_path

  if (!filePath) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })

  const { data: fileData, error: dlError } = await supabase.storage
    .from('documents')
    .download(filePath)

  if (dlError || !fileData) {
    console.error('Erro no download do PDF:', dlError)
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
  }

  const buffer = await fileData.arrayBuffer()
  const safeName = doc.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_') || 'documento'
  const suffix = doc.signed_file_path ? '_assinado' : ''

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName}${suffix}.pdf"`,
    },
  })
}
