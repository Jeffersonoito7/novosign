import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const admin = getAdmin()
  const { data } = await admin.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'superadmin'
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await assertSuperAdmin()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id } = await params
  const supabase = getAdmin()

  const { data: doc } = await supabase.from('documents').select('file_path, signed_file_path').eq('id', id).single()

  if (doc) {
    const paths = [doc.file_path, doc.signed_file_path].filter(Boolean)
    if (paths.length > 0) {
      await supabase.storage.from('documents').remove(paths)
    }
  }

  await supabase.from('audit_events').delete().eq('document_id', id)
  await supabase.from('verification_codes').delete().eq('signatory_id',
    supabase.from('signatories').select('id').eq('document_id', id) as any
  )
  await supabase.from('signatories').delete().eq('document_id', id)
  await supabase.from('documents').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
