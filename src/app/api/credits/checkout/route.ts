import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, CREDIT_PACKAGES } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { packageId, annual } = await req.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, company_id, companies(id, name)')
    .eq('id', user.id)
    .single()

  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
  if (!pkg) return NextResponse.json({ error: 'Pacote inválido' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const unitAmount = annual ? pkg.priceAnnual : pkg.price

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: profile?.email ?? user.email,
    line_items: [
      {
        price_data: {
          currency: 'brl',
          unit_amount: unitAmount,
          product_data: {
            name: `NovoSign — ${pkg.credits} créditos (${pkg.name})`,
            description: `${pkg.credits} documentos para envio de assinatura eletrônica${annual ? ' — plano anual' : ''}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      company_id: profile?.company_id ?? '',
      credits: pkg.credits.toString(),
      package_id: pkg.id,
      package_name: pkg.name,
      annual: annual ? 'true' : 'false',
    },
    success_url: `${appUrl}/dashboard/credits?success=true&credits=${pkg.credits}`,
    cancel_url: `${appUrl}/dashboard/credits?cancelled=true`,
    locale: 'pt-BR',
  })

  return NextResponse.json({ url: session.url })
}
