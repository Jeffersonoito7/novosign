import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const admin = getAdmin()
    const { data: profile } = await admin.from('users').select('company_id').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const message = formData.get('message') as string | null
    const signatories = JSON.parse(formData.get('signatories') as string ?? '[]')

    if (!file || !title) return NextResponse.json({ error: 'Arquivo e título são obrigatórios' }, { status: 400 })

    // Hash SHA-256
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const fileHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    // Sanitizar nome do arquivo (remove acentos, espaços e caracteres especiais)
    const safeName = file.name
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')

    // Upload via admin (bypassa RLS do storage)
    const fileName = `${profile.company_id}/${Date.now()}_${safeName}`
    const { error: uploadError } = await admin.storage
      .from('documents')
      .upload(fileName, file, { contentType: 'application/pdf' })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Erro ao fazer upload: ' + uploadError.message }, { status: 500 })
    }

    // Criar documento
    const { data: doc, error: docError } = await admin.from('documents').insert({
      company_id: profile.company_id,
      title,
      message: message || null,
      file_path: fileName,
      file_hash: fileHash,
      created_by: user.id,
      status: 'draft',
    }).select().single()

    if (docError || !doc) {
      console.error('Doc insert error:', docError)
      return NextResponse.json({ error: 'Erro ao criar documento' }, { status: 500 })
    }

    // Criar assinantes
    if (signatories.length > 0) {
      const sigInserts = signatories.map((s: any, i: number) => ({
        document_id: doc.id,
        name: s.name,
        email: s.email,
        phone: s.phone || null,
        cpf: s.cpf || null,
        sign_order: i + 1,
        notification_channel: s.notification_channel ?? 'email',
      }))

      const { error: sigError } = await admin.from('signatories').insert(sigInserts)
      if (sigError) {
        console.error('Signatories insert error:', sigError)
        return NextResponse.json({ error: 'Erro ao adicionar assinantes' }, { status: 500 })
      }
    }

    // Auditoria
    await admin.from('audit_events').insert({
      document_id: doc.id,
      event_type: 'document_created',
      metadata: { created_by: user.id },
    })

    return NextResponse.json({ ok: true, documentId: doc.id })
  } catch (err: any) {
    console.error('Erro ao criar documento:', err)
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 })
  }
}
