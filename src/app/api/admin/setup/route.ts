import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Rota de setup única — define o email informado como superadmin
// Só funciona se ainda não existir nenhum superadmin no banco
export async function POST(req: NextRequest) {
  const { email, secret } = await req.json()

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Checar se já existe um superadmin
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'superadmin')
    .limit(1)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Superadmin já configurado' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('users')
    .update({ role: 'superadmin' })
    .eq('email', email)
    .select()

  if (error || !data?.length) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, updated: data })
}
