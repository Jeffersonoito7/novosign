import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: doc } = await supabase
    .from('documents')
    .select('signed_file_path, title')
    .eq('id', id)
    .single()

  if (!doc?.signed_file_path) {
    return NextResponse.json({ error: 'PDF assinado não disponível' }, { status: 404 })
  }

  const { data: fileData } = await supabase.storage
    .from('documents')
    .download(doc.signed_file_path)

  if (!fileData) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })

  const buffer = await fileData.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${doc.title.replace(/[^a-z0-9]/gi, '_')}_assinado.pdf"`,
    },
  })
}
