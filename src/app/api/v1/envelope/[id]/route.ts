/**
 * GET /api/v1/envelope/:id
 * Retorna o status do documento e cada assinante.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(req.headers.get('authorization'))
  if (!auth) return NextResponse.json({ error: 'API Key inválida.' }, { status: 401 })

  const { id } = await params
  const supabase = getAdmin()

  const { data: doc } = await supabase
    .from('documents')
    .select('id, title, status, file_hash, signed_file_hash, created_at, signatories(*)')
    .eq('id', id)
    .eq('company_id', auth.companyId)
    .single()

  if (!doc) return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://novosign.com.br'
  const signatories = (doc.signatories as any[]).map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    status: s.status,
    signed_at: s.signed_at,
    sign_url: `${appUrl}/sign/${s.token}`,
  }))

  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    status: doc.status,
    file_hash: doc.file_hash,
    signed_file_hash: doc.signed_file_hash,
    verify_url: doc.signed_file_hash ? `${appUrl}/verify/${doc.signed_file_hash}` : null,
    download_url: doc.status === 'completed' ? `${appUrl}/api/documents/${doc.id}/pdf` : null,
    created_at: doc.created_at,
    signatories,
  })
}
