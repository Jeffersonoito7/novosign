import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const steps: Record<string, string> = {}

  try {
    // 1. Buscar último documento assinado
    const supabase = getAdmin()
    steps['1_admin_client'] = 'ok'

    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('*, signatories(*)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (docErr || !doc) {
      // Tentar pegar qualquer documento pending
      const { data: doc2, error: doc2Err } = await supabase
        .from('documents')
        .select('*, signatories(*)')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (doc2Err || !doc2) {
        return NextResponse.json({ steps, error: 'Nenhum documento encontrado', docErr: docErr?.message })
      }

      steps['2_find_doc'] = `encontrado: ${doc2.title} (${doc2.status})`

      // 2. Testar download do arquivo
      const { data: fileData, error: dlErr } = await supabase.storage
        .from('documents')
        .download(doc2.file_path)

      if (dlErr || !fileData) {
        steps['3_download'] = `ERRO: ${dlErr?.message}`
        return NextResponse.json({ steps, error: 'Falha no download do PDF' })
      }
      steps['3_download'] = `ok (${(fileData.size / 1024).toFixed(0)} KB)`

      // 3. Testar geração do PDF
      const originalBytes = new Uint8Array(await fileData.arrayBuffer())
      steps['4_bytes'] = `ok (${originalBytes.length} bytes)`

      const { generateSignedPDF } = await import('@/lib/pdf/generate')
      steps['5_import_pdf_lib'] = 'ok'

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://novosign.com.br'
      const { pdfBytes, hash } = await generateSignedPDF({
        originalPdfBytes: originalBytes,
        document: doc2,
        signatories: doc2.signatories ?? [],
        appUrl,
      })

      steps['6_generate_pdf'] = `ok (${pdfBytes.length} bytes, hash: ${hash.slice(0, 16)}...)`

      return NextResponse.json({ ok: true, steps })
    }

    steps['2_find_doc'] = `encontrado: ${doc.title} (${doc.status})`
    return NextResponse.json({ ok: true, steps, doc: doc.title })

  } catch (err: any) {
    return NextResponse.json({
      steps,
      error: err?.message ?? String(err),
      stack: err?.stack?.split('\n').slice(0, 5),
    }, { status: 500 })
  }
}
