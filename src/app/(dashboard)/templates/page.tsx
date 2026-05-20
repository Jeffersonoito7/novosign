import { createClient } from '@/lib/supabase/server'
import { FileCheck, Plus, FileText } from 'lucide-react'
import Link from 'next/link'

const DEFAULT_TEMPLATES = [
  {
    id: 'auto-vale',
    title: 'Contrato de Representante — Proteção Veicular',
    description: 'Contrato para consultores de proteção veicular. Inclui cláusulas de comissionamento, confidencialidade e rescisão.',
    variables: ['Nome_consultor', 'CNPJ_consultor', 'Logradouro', 'Cidade', 'CPF_consultor'],
    category: 'Comercial',
  },
  {
    id: 'prestacao-servicos',
    title: 'Contrato de Prestação de Serviços',
    description: 'Modelo genérico de prestação de serviços entre PJ e PF ou PJ e PJ.',
    variables: ['Nome_contratante', 'Nome_contratado', 'Objeto', 'Valor', 'Prazo'],
    category: 'Comercial',
  },
  {
    id: 'nda',
    title: 'Acordo de Confidencialidade (NDA)',
    description: 'Proteja informações sensíveis com um NDA bilateral ou unilateral.',
    variables: ['Parte_A', 'Parte_B', 'Prazo_confidencialidade', 'Objeto'],
    category: 'Jurídico',
  },
  {
    id: 'matricula',
    title: 'Contrato de Matrícula Educacional',
    description: 'Ideal para escolas, cursos e plataformas EAD. Inclui cláusulas de cancelamento e reembolso.',
    variables: ['Nome_aluno', 'CPF_aluno', 'Curso', 'Valor', 'Data_inicio'],
    category: 'Educação',
  },
]

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('company_id').eq('id', user!.id).single()

  const { data: customTemplates } = await supabase
    .from('document_templates')
    .select('*')
    .eq('company_id', profile?.company_id)
    .order('created_at', { ascending: false })

  const categoryColors: Record<string, { bg: string; color: string }> = {
    Comercial: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
    Jurídico: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
    Educação: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    Custom: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Templates</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Modelos prontos para usar — preencha as variáveis e envie para assinatura
          </p>
        </div>
      </div>

      {/* Templates padrão */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Modelos prontos
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {DEFAULT_TEMPLATES.map(t => {
            const cat = categoryColors[t.category] ?? categoryColors.Comercial
            return (
              <div key={t.id} className="rounded-xl border p-5 flex gap-4"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--blue-light)' }}>
                  <FileCheck size={18} style={{ color: 'var(--blue-primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{t.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                      style={{ background: cat.bg, color: cat.color }}>{t.category}</span>
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{t.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.variables.slice(0, 3).map(v => (
                      <span key={v} className="text-xs px-2 py-0.5 rounded font-mono"
                        style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                        {'{{'}{v}{'}}'}
                      </span>
                    ))}
                    {t.variables.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--text-muted)' }}>
                        +{t.variables.length - 3}
                      </span>
                    )}
                  </div>
                  <Link href={`/documents/new?template=${t.id}`}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--blue-primary)' }}>
                    Usar este modelo →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Templates customizados */}
      {(customTemplates?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Meus templates
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {customTemplates!.map((t: any) => (
              <div key={t.id} className="rounded-xl border p-5 flex gap-4"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <FileText size={18} style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{t.title}</p>
                  <Link href={`/documents/new?template=${t.id}`}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--blue-primary)' }}>
                    Usar este modelo →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
