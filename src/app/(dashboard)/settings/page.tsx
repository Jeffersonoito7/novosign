import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('*, companies(*)')
    .eq('id', user!.id)
    .single()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Dados da Empresa</h2>
        <div className="space-y-3 text-sm">
          <div><span className="text-gray-500">Nome:</span> <span className="font-medium">{profile?.companies?.name}</span></div>
          <div><span className="text-gray-500">CNPJ:</span> <span className="font-medium">{profile?.companies?.cnpj ?? 'Não informado'}</span></div>
          <div><span className="text-gray-500">E-mail:</span> <span className="font-medium">{profile?.companies?.email}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Meu Perfil</h2>
        <div className="space-y-3 text-sm">
          <div><span className="text-gray-500">Nome:</span> <span className="font-medium">{profile?.name}</span></div>
          <div><span className="text-gray-500">E-mail:</span> <span className="font-medium">{profile?.email}</span></div>
          <div><span className="text-gray-500">Função:</span> <span className="font-medium capitalize">{profile?.role}</span></div>
        </div>
      </div>
    </div>
  )
}
