import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single()

  const { data: hooks } = await supabase
    .from('webhooks')
    .select('id, url, events, active, created_at')
    .eq('company_id', profile!.company_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ webhooks: hooks ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { url, events } = await req.json()
  if (!url) return NextResponse.json({ error: '"url" é obrigatório.' }, { status: 400 })

  const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single()
  const secret = randomBytes(32).toString('hex')

  const { data: hook, error } = await supabase
    .from('webhooks')
    .insert({
      company_id: profile!.company_id,
      url,
      events: events ?? ['document.completed', 'document.rejected'],
      secret,
    })
    .select('id, url, events, created_at')
    .single()

  if (error || !hook) return NextResponse.json({ error: 'Erro ao criar webhook.' }, { status: 500 })

  return NextResponse.json({ ...hook, secret }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await req.json()
  const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single()

  await supabase.from('webhooks').delete().eq('id', id).eq('company_id', profile!.company_id)
  return NextResponse.json({ ok: true })
}
