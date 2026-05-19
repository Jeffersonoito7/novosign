import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKAGES, formatPrice, pricePerCredit } from '@/lib/stripe'
import { Zap, History, CheckCircle, AlertCircle } from 'lucide-react'
import BuyCreditsForm from './BuyCreditsForm'
import { formatDate } from '@/lib/utils'

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string; credits?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  const { data: company } = await supabase
    .from('companies')
    .select('credits')
    .eq('id', profile!.company_id)
    .single()

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('company_id', profile!.company_id)
    .order('created_at', { ascending: false })
    .limit(20)

  const balance = company?.credits ?? 0

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Créditos</h1>
      <p className="text-gray-500 text-sm mb-8">1 crédito = 1 documento enviado para assinatura</p>

      {/* Feedback de pagamento */}
      {sp.success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <p className="text-green-800 font-medium">
            Pagamento confirmado! <strong>{sp.credits} créditos</strong> foram adicionados à sua conta.
          </p>
        </div>
      )}
      {sp.cancelled && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
          <AlertCircle size={20} className="text-amber-600 shrink-0" />
          <p className="text-amber-800">Pagamento cancelado. Nenhum crédito foi cobrado.</p>
        </div>
      )}

      {/* Saldo atual */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-8 flex items-center justify-between">
        <div>
          <p className="text-blue-200 text-sm font-medium mb-1">Saldo atual</p>
          <p className="text-5xl font-bold">{balance}</p>
          <p className="text-blue-200 text-sm mt-1">crédito{balance !== 1 ? 's' : ''} disponível{balance !== 1 ? 'is' : ''}</p>
        </div>
        <div className="w-16 h-16 bg-blue-500/40 rounded-2xl flex items-center justify-center">
          <Zap size={32} className="text-white" />
        </div>
      </div>

      {/* Pacotes */}
      <BuyCreditsForm packages={CREDIT_PACKAGES} />

      {/* Histórico */}
      {(transactions?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mt-8">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <History size={16} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Histórico de transações</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {transactions!.map((tx: any) => {
              const isDebit = tx.credits < 0
              return (
                <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isDebit ? 'text-red-500' : 'text-green-600'}`}>
                      {isDebit ? '' : '+'}{tx.credits} crédito{Math.abs(tx.credits) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-400">Saldo: {tx.balance_after}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
