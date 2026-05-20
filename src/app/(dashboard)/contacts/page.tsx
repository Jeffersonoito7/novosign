'use client'

import { useEffect, useState } from 'react'
import { Users, Plus, Trash2, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  cpf?: string
  created_at: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', cpf: '' })

  useEffect(() => { fetchContacts() }, [])

  async function fetchContacts() {
    const supabase = createClient()
    const { data: profile } = await supabase.from('users').select('company_id').eq('id', (await supabase.auth.getUser()).data.user!.id).single()
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', profile?.company_id)
      .order('name')
    setContacts(data ?? [])
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: profile } = await supabase.from('users').select('company_id').eq('id', (await supabase.auth.getUser()).data.user!.id).single()
    await supabase.from('contacts').insert({ ...form, company_id: profile?.company_id })
    setForm({ name: '', email: '', phone: '', cpf: '' })
    setShowForm(false)
    setLoading(false)
    fetchContacts()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover contato?')) return
    const supabase = createClient()
    await supabase.from('contacts').delete().eq('id', id)
    fetchContacts()
  }

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Contatos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{contacts.length} contato(s) cadastrado(s)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ background: 'var(--blue-primary)' }}>
          <Plus size={16} /> Novo Contato
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="rounded-xl border p-5 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Adicionar contato</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
            {[
              { key: 'name', label: 'Nome completo', placeholder: 'João da Silva', required: true },
              { key: 'email', label: 'E-mail', placeholder: 'joao@email.com', required: true },
              { key: 'phone', label: 'Telefone/WhatsApp', placeholder: '(87) 99999-9999', required: false },
              { key: 'cpf', label: 'CPF', placeholder: '000.000.000-00', required: false },
            ].map(({ key, label, placeholder, required }) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  required={required}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            ))}
            <div className="col-span-2 flex gap-3 justify-end mt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm border transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50 hover:opacity-90"
                style={{ background: 'var(--blue-primary)' }}>
                {loading ? 'Salvando...' : 'Salvar contato'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Lista */}
      <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              {search ? 'Nenhum contato encontrado.' : 'Nenhum contato cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Nome', 'E-mail', 'Telefone', 'CPF', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'var(--blue-primary)' }}>
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{c.phone ?? '—'}</td>
                  <td className="px-5 py-3.5 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{c.cpf ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleDelete(c.id)} className="hover:text-red-500 transition-colors"
                      style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
