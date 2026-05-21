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

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, company_id')
      .eq('id', userId)
      .single()

    if (existingUser) {
      // Usuário já registrado — redireciona normalmente
      return NextResponse.json({ ok: true, companyId: existingUser.company_id })
    }

    // Criar empresa com 3 créditos grátis
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName, cnpj: cnpj || null, email, credits: 3 })
      .select()
      .single()

    if (companyError || !company) {
      console.error('Erro ao criar empresa:', companyError)
      return NextResponse.json({ error: 'Erro ao criar empresa: ' + companyError?.message }, { status: 500 })
    }

    // Criar perfil do usuário com upsert para evitar duplicata
    const { error: userError } = await supabase.from('users').upsert({
      id: userId,
      company_id: company.id,
      name,
      email,
      role: 'owner',
    })

    if (userError) {
      console.error('Erro ao criar usuário:', userError)
      await supabase.from('companies').delete().eq('id', company.id)
      return NextResponse.json({ error: 'Erro ao criar perfil: ' + userError.message }, { status: 500 })
    }

    // Créditos de boas-vindas
    await supabase.from('credit_transactions').insert({
      company_id: company.id,
      type: 'bonus',
      credits: 3,
      balance_after: 3,
      description: 'Bônus de boas-vindas — 3 créditos grátis',
    })

    return NextResponse.json({ ok: true, companyId: company.id })
  } catch (err: any) {
    console.error('Erro no registro:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro interno do servidor' }, { status: 500 })
  }
}
