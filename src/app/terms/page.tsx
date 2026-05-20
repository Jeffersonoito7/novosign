import Link from 'next/link'
import Image from 'next/image'

export const metadata = { title: 'Termos de Uso — NovoSign' }

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="border-b px-6 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="NovoSign" width={28} height={28} />
          <span className="font-bold" style={{ color: 'var(--blue-primary)' }}>NovoSign</span>
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Termos de Uso</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Última atualização: maio de 2026</p>

        {[
          { title: '1. Aceitação dos termos', content: 'Ao utilizar o NovoSign, você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço.' },
          { title: '2. O serviço', content: 'O NovoSign é uma plataforma de assinatura eletrônica com validade jurídica conforme a Lei 14.063/2020 e a Medida Provisória 2.200-2/2001. O serviço permite enviar documentos para assinatura eletrônica avançada.' },
          { title: '3. Créditos e pagamentos', content: 'O serviço funciona por créditos. 1 crédito = 1 documento enviado para assinatura. Os créditos não expiram. Pagamentos são processados pelo Stripe e não são reembolsáveis, exceto em casos de falha técnica comprovada.' },
          { title: '4. Responsabilidades do usuário', content: 'O usuário é responsável pelo conteúdo dos documentos enviados. É proibido utilizar o NovoSign para enviar documentos fraudulentos, ilegais ou que violem direitos de terceiros.' },
          { title: '5. Validade jurídica', content: 'As assinaturas geradas pelo NovoSign têm validade jurídica conforme a legislação brasileira vigente. A plataforma não se responsabiliza por disputas contratuais entre as partes signatárias.' },
          { title: '6. Disponibilidade', content: 'O NovoSign se esforça para manter o serviço disponível 24/7, mas não garante disponibilidade ininterrupta. Manutenções serão comunicadas com antecedência.' },
          { title: '7. Rescisão', content: 'O NovoSign pode suspender ou encerrar contas que violem estes termos. Créditos não utilizados serão reembolsados em caso de encerramento por iniciativa da plataforma.' },
          { title: '8. Foro', content: 'Estes termos são regidos pelas leis brasileiras. Eventuais disputas serão resolvidas no foro da comarca de Petrolina/PE.' },
        ].map(({ title, content }) => (
          <div key={title} className="mb-8">
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{content}</p>
          </div>
        ))}
      </main>
    </div>
  )
}
