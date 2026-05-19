import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey } from '@/lib/api-auth'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single()

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, active, last_used_at, expires_at, created_at')
    .eq('company_id', profile!.company_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ keys: keys ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: '"name" é obrigatório.' }, { status: 400 })

  const { data: profile } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
  if (!['owner', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Apenas proprietários e admins podem criar API Keys.' }, { status: 403 })
  }

  const { key, prefix, hash } = generateApiKey()

  const { data: created, error } = await supabase
    .from('api_keys')
    .insert({
      company_id: profile!.company_id,
      name: name.trim(),
      key_hash: hash,
      key_prefix: prefix,
    })
    .select('id, name, key_prefix, created_at')
    .single()

  if (error || !created) return NextResponse.json({ error: 'Erro ao criar API Key.' }, { status: 500 })

  // Retornar a chave completa APENAS neste momento — nunca mais será exibida
  return NextResponse.json({ ...created, key }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await req.json()
  const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single()

  await supabase
    .from('api_keys')
    .update({ active: false })
    .eq('id', id)
    .eq('company_id', profile!.company_id)

  return NextResponse.json({ ok: true })
}
