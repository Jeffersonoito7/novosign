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

  const { companyId, credits, reason } = await req.json()
  if (!companyId || !credits || credits <= 0) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const supabase = getAdmin()

  const { data: company } = await supabase
    .from('companies')
    .select('credits')
    .eq('id', companyId)
    .single()

  if (!company) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })

  const newBalance = company.credits + credits

  await supabase.from('companies').update({ credits: newBalance }).eq('id', companyId)

  await supabase.from('credit_transactions').insert({
    company_id: companyId,
    type: 'bonus',
    credits,
    balance_after: newBalance,
    description: reason ?? 'Adicionado pelo admin',
  })

  return NextResponse.json({ ok: true, newBalance })
}
