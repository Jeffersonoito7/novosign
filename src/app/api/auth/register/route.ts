import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name, email, companyName, cnpj } = await req.json()

    if (!userId || !name || !email || !companyName) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const supabase = getAdmin()

    // Criar empresa com 3 créditos grátis
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName, cnpj: cnpj || null, email, credits: 3 })
      .select()
      .single()

    if (companyError || !company) {
      console.error('Erro ao criar empresa:', companyError)
      return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 })
    }

    // Criar perfil do usuário
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      company_id: company.id,
      name,
      email,
      role: 'owner',
    })

    if (userError) {
      console.error('Erro ao criar usuário:', userError)
      // Rollback empresa
      await supabase.from('companies').delete().eq('id', company.id)
      return NextResponse.json({ error: 'Erro ao criar perfil de usuário' }, { status: 500 })
    }

    // Registrar créditos de boas-vindas
    await supabase.from('credit_transactions').insert({
      company_id: company.id,
      type: 'bonus',
      credits: 3,
      balance_after: 3,
      description: 'Bônus de boas-vindas — 3 créditos grátis',
    })

    return NextResponse.json({ ok: true, companyId: company.id })
  } catch (err) {
    console.error('Erro no registro:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
