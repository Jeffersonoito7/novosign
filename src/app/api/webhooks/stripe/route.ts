import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient as createServerClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Usar service role para operações do webhook (sem autenticação de usuário)
function getAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature inválida:', err.message)
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const companyId = session.metadata?.company_id
    const credits = parseInt(session.metadata?.credits ?? '0')
    const packageId = session.metadata?.package_id ?? ''
    const packageName = session.metadata?.package_name ?? ''

    if (!companyId || !credits) {
      return NextResponse.json({ error: 'Metadata inválida' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Buscar saldo atual
    const { data: company } = await supabase
      .from('companies')
      .select('credits')
      .eq('id', companyId)
      .single()

    const currentCredits = company?.credits ?? 0
    const newBalance = currentCredits + credits

    // Adicionar créditos à empresa
    await supabase
      .from('companies')
      .update({ credits: newBalance })
      .eq('id', companyId)

    // Registrar transação
    await supabase.from('credit_transactions').insert({
      company_id: companyId,
      type: 'purchase',
      credits: credits,
      balance_after: newBalance,
      description: `Compra de ${credits} créditos — pacote ${packageName}`,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
    })

    console.log(`✅ ${credits} créditos adicionados à empresa ${companyId}. Novo saldo: ${newBalance}`)
  }

  return NextResponse.json({ received: true })
}
