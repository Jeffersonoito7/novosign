import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Shield, FileText, CheckCircle, Zap, Lock, Globe, ArrowRight, Star } from 'lucide-react'

export const metadata = {
  title: 'NovoSign — Assinatura Eletrônica com Validade Jurídica',
  description: 'Assine contratos digitalmente com validade jurídica pela Lei 14.063/2020. Mais rápido, mais seguro e mais barato que o papel. Comece grátis.',
  keywords: 'assinatura eletrônica, assinatura digital, contrato digital, validade jurídica, NovoSign',
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>

      {/* Header */}
      <header className="border-b sticky top-0 z-50 backdrop-blur-sm"
        style={{ background: 'rgba(255,255,255,0.9)', borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="NovoSign" width={32} height={32} />
            <span className="text-lg font-bold" style={{ color: 'var(--blue-primary)' }}>NovoSign</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <a href="#como-funciona" className="hover:opacity-70 transition-opacity">Como funciona</a>
            <a href="#precos" className="hover:opacity-70 transition-opacity">Preços</a>
            <a href="#validade" className="hover:opacity-70 transition-opacity">Validade jurídica</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}>
              Entrar
            </Link>
            <Link href="/register"
              className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--blue-primary)' }}>
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 border"
          style={{ background: 'var(--blue-light)', borderColor: 'var(--blue-border)', color: 'var(--blue-primary)' }}>
          <Shield size={12} /> Lei 14.063/2020 · Assinatura Eletrônica Avançada
        </div>

        <h1 className="text-5xl font-bold mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
          Assine documentos com<br />
          <span style={{ color: 'var(--blue-primary)' }}>validade jurídica</span>
        </h1>
        <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Envie contratos, colete assinaturas e gere PDFs com certificado digital.
          Mais rápido que papel, com a mesma validade legal.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register"
            className="flex items-center gap-2 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-opacity hover:opacity-90"
            style={{ background: 'var(--blue-primary)' }}>
            Começar grátis <ArrowRight size={20} />
          </Link>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            3 créditos grátis · Sem cartão
          </p>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-1 mt-8">
          {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
          <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>
            Usado por associações e empresas em todo o Brasil
          </span>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-16 border-y" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            Como funciona
          </h2>
          <p className="text-center mb-12" style={{ color: 'var(--text-secondary)' }}>
            Em menos de 2 minutos seu documento está assinado
          </p>

          <div className="grid grid-cols-3 gap-8">
            {[
              { step: '01', icon: FileText, title: 'Faça upload do PDF', desc: 'Envie o contrato ou documento que precisa ser assinado. Suportamos PDFs de até 20MB.' },
              { step: '02', icon: Zap, title: 'Defina os signatários', desc: 'Adicione nome, e-mail e CPF de cada pessoa que precisa assinar. Notificamos por e-mail ou WhatsApp.' },
              { step: '03', icon: CheckCircle, title: 'Receba o PDF assinado', desc: 'Após todas as assinaturas, geramos o PDF com certificado digital e trilha de auditoria completa.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'var(--blue-light)' }}>
                  <Icon size={24} style={{ color: 'var(--blue-primary)' }} />
                </div>
                <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>PASSO {step}</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-6">
            {[
              { icon: Shield, title: 'Validade jurídica garantida', desc: 'Conforme a Lei 14.063/2020. Aceito em qualquer tribunal brasileiro. Mais seguro que assinatura em papel.' },
              { icon: Lock, title: 'Hash SHA-256 em cada documento', desc: 'Todo documento recebe uma impressão digital criptográfica única. Qualquer alteração é detectada imediatamente.' },
              { icon: Globe, title: 'Assine de qualquer lugar', desc: 'O signatário recebe um link e assina do celular, sem precisar instalar nada. Funciona em qualquer dispositivo.' },
              { icon: Zap, title: 'De dias para minutos', desc: 'Elimine impressão, escaneamento e envio por correio. Contratos que levavam dias são assinados em minutos.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border p-6 flex gap-4"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--blue-light)' }}>
                  <Icon size={20} style={{ color: 'var(--blue-primary)' }} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="py-16 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            Preço simples e transparente
          </h2>
          <p className="text-center mb-12" style={{ color: 'var(--text-secondary)' }}>
            Pague apenas pelos documentos que enviar. Sem mensalidade obrigatória.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { credits: 15, price: 'R$ 59,90', per: 'R$ 3,99/doc', highlight: false },
              { credits: 100, price: 'R$ 279,00', per: 'R$ 2,79/doc', highlight: true },
              { credits: 500, price: 'R$ 1.249,00', per: 'R$ 2,49/doc', highlight: false },
            ].map(({ credits, price, per, highlight }) => (
              <div key={credits} className="rounded-2xl border p-6 text-center relative"
                style={{
                  background: highlight ? 'var(--blue-primary)' : 'var(--bg-card)',
                  borderColor: highlight ? 'var(--blue-primary)' : 'var(--border)',
                  color: highlight ? 'white' : 'inherit',
                }}>
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                    Mais popular
                  </div>
                )}
                <p className="text-4xl font-bold mb-1">{credits}</p>
                <p className="text-sm mb-4" style={{ opacity: 0.7 }}>créditos</p>
                <p className="text-2xl font-bold mb-1">{price}</p>
                <p className="text-xs" style={{ opacity: 0.7 }}>{per}</p>
                <Link href="/register"
                  className="mt-5 block py-2.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
                  style={{ background: highlight ? 'white' : 'var(--blue-primary)', color: highlight ? 'var(--blue-primary)' : 'white' }}>
                  Começar agora
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            Os créditos não expiram. Comece com 3 créditos grátis, sem cartão de crédito.
          </p>
        </div>
      </section>

      {/* Validade jurídica */}
      <section id="validade" className="py-16 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Shield size={40} className="mx-auto mb-4" style={{ color: 'var(--blue-primary)' }} />
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Validade jurídica plena
          </h2>
          <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            O NovoSign utiliza <strong>Assinatura Eletrônica Avançada</strong> conforme definida pela
            Lei nº 14.063/2020 e pela Medida Provisória 2.200-2/2001. Nossos documentos têm a
            mesma validade jurídica de contratos assinados em papel e reconhecidos em cartório.
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {[
              'Verificação de identidade por código único',
              'Captura de IP, horário e geolocalização',
              'Hash SHA-256 imutável do documento',
              'Trilha de auditoria completa',
              'Certificado de assinatura em PDF',
              'QR Code de verificação pública',
            ].map(item => (
              <div key={item} className="flex items-start gap-2 text-left p-3 rounded-lg"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                <CheckCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Comece a assinar hoje
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
            3 créditos grátis para você testar. Sem cartão de crédito.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 text-white px-10 py-4 rounded-xl font-bold text-lg transition-opacity hover:opacity-90"
            style={{ background: 'var(--blue-primary)' }}>
            Criar conta grátis <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="NovoSign" width={20} height={20} />
            <span>NovoSign © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:opacity-70">Privacidade</Link>
            <Link href="/terms" className="hover:opacity-70">Termos de uso</Link>
            <a href="mailto:contato@novosign.com.br" className="hover:opacity-70">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
