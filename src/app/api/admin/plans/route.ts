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

export async function POST(req: NextRequest) {
  if (!await assertSuperAdmin()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const { name, price_monthly, documents_limit, users_limit, features } = body

  if (!name || price_monthly == null || !documents_limit || !users_limit) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const supabase = getAdmin()
  const { data, error } = await supabase.from('plans').insert({
    name,
    price_monthly,
    documents_limit,
    users_limit,
    features: features ?? [],
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, plan: data })
}
