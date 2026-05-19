import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY não configurada')
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' })
  }
  return _stripe
}

// Mantido para compatibilidade — usar getStripe() nas rotas de API
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})

export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 15,
    price: 5990,        // R$ 59,90
    priceAnnual: 4490,  // R$ 44,90/mês no anual
    highlight: false,
  },
  {
    id: 'basico',
    name: 'Básico',
    credits: 30,
    price: 9900,
    priceAnnual: 7900,
    highlight: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 100,
    price: 27900,
    priceAnnual: 21900,
    highlight: true, // mais popular
  },
  {
    id: 'business',
    name: 'Business',
    credits: 200,
    price: 52900,
    priceAnnual: 41900,
    highlight: false,
  },
  {
    id: 'scale',
    name: 'Scale',
    credits: 500,
    price: 124900,
    priceAnnual: 99900,
    highlight: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 1000,
    price: 219900,
    priceAnnual: 159900,
    highlight: false,
  },
]

export function pricePerCredit(price: number, credits: number): string {
  return (price / credits / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
