'use client'

import { useState } from 'react'
import { Check, Zap } from 'lucide-react'
import { formatPrice, pricePerCredit } from '@/lib/stripe'

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
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleBuy() {
    if (!selected) return
    setLoading(true)
    const res = await fetch('/api/credits/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId: selected, annual }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert(data.error ?? 'Erro ao iniciar pagamento.')
      setLoading(false)
    }
  }

  const selectedPkg = packages.find(p => p.id === selected)
  const selectedPrice = selectedPkg ? (annual ? selectedPkg.priceAnnual : selectedPkg.price) : null

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Comprar créditos
        </h2>
        <div className="flex items-center rounded-xl p-1 border ml-auto" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)' }}>
          <button
            onClick={() => setAnnual(false)}
            className="px-5 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: !annual ? 'var(--bg-card)' : 'transparent',
              color: !annual ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: !annual ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Avulso
          </button>
          <button
            onClick={() => setAnnual(true)}
            className="px-5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={{
              background: annual ? 'var(--bg-card)' : 'transparent',
              color: annual ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: annual ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Mensal
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#059669' }}>
              −12%
            </span>
          </button>
        </div>
      </div>

      {/* Grade de pacotes */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {packages.map(pkg => {
          const price = annual ? pkg.priceAnnual : pkg.price
          const isSelected = selected === pkg.id

          return (
            <button
              key={pkg.id}
              onClick={() => setSelected(pkg.id)}
              className="relative rounded-2xl border p-5 text-left transition-all cursor-pointer"
              style={{
                background: isSelected ? 'var(--blue-light)' : 'var(--bg-card)',
                borderColor: isSelected ? 'var(--blue-primary)' : 'var(--border)',
                borderWidth: isSelected ? 2 : 1,
                outline: 'none',
              }}
            >
              {/* Selecionado */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--blue-primary)' }}>
                  <Check size={12} color="white" strokeWidth={3} />
                </div>
              )}

              {/* Créditos */}
              <div className="mb-3">
                <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {pkg.credits}
                </span>
                <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>créditos</span>
              </div>

              {/* Preço */}
              <div>
                <p className="text-xl font-bold" style={{ color: 'var(--blue-primary)' }}>
                  {formatPrice(price)}
                  {annual && <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/mês</span>}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {pricePerCredit(price, pkg.credits)} por crédito
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Área de compra */}
      <div className="rounded-2xl border p-5 flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div>
          {selectedPkg ? (
            <>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {selectedPkg.credits} créditos selecionados
              </p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {formatPrice(selectedPrice!)}
                {annual && <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/mês</span>}
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Selecione um pacote acima
            </p>
          )}
        </div>

        <button
          onClick={handleBuy}
          disabled={!selected || loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium text-sm transition-opacity disabled:opacity-40 hover:opacity-90"
          style={{ background: 'var(--blue-primary)' }}
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Zap size={16} />
          }
          {loading ? 'Aguarde...' : 'Comprar agora'}
        </button>
      </div>

      <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
        Pagamento seguro via Stripe · Cartão de crédito · Os créditos não expiram
      </p>
    </div>
  )
}
