'use client'

import { useState } from 'react'
import { Star, Zap } from 'lucide-react'
import { formatPrice, pricePerCredit } from '@/lib/stripe'
import { useRouter } from 'next/navigation'

interface Package {
  id: string
  name: string
  credits: number
  price: number
  priceAnnual: number
  highlight: boolean
}

export default function BuyCreditsForm({ packages }: { packages: Package[] }) {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleBuy(packageId: string) {
    setLoading(packageId)
    const res = await fetch('/api/credits/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId, annual }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert(data.error ?? 'Erro ao iniciar pagamento.')
      setLoading(null)
    }
  }

  const savings = annual ? 12 : 0

  return (
    <div>
      {/* Toggle mensal/anual */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Comprar créditos</h2>
        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Avulso
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Mensal
            <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-bold">−12%</span>
          </button>
        </div>
      </div>

      {annual && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-sm text-green-800">
          <strong>Plano mensal:</strong> créditos renováveis todo mês com 12% de desconto. Cancele quando quiser.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {packages.map(pkg => {
          const price = annual ? pkg.priceAnnual : pkg.price
          const perCredit = pricePerCredit(price, pkg.credits)
          const isLoading = loading === pkg.id

          return (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-2xl border p-5 flex flex-col ${
                pkg.highlight
                  ? 'border-blue-400 shadow-md shadow-blue-100'
                  : 'border-gray-200'
              }`}
            >
              {pkg.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={10} fill="white" /> Mais popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">{pkg.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {pkg.credits}
                  <span className="text-base font-normal text-gray-500 ml-1">créditos</span>
                </p>
              </div>

              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(price)}
                  {annual && <span className="text-sm font-normal text-gray-500">/mês</span>}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">{perCredit} por crédito</p>
              </div>

              <button
                onClick={() => handleBuy(pkg.id)}
                disabled={isLoading}
                className={`mt-5 w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  pkg.highlight
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap size={14} />
                )}
                {isLoading ? 'Aguarde...' : 'Comprar'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mt-5">
        Pagamento seguro via Stripe · Cartão de crédito · Pix em breve
      </p>
    </div>
  )
}
