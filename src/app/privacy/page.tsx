import Link from 'next/link'
import Image from 'next/image'

export const metadata = { title: 'Política de Privacidade — NovoSign' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="border-b px-6 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="NovoSign" width={28} height={28} />
          <span className="font-bold" style={{ color: 'var(--blue-primary)' }}>NovoSign</span>
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Política de Privacidade</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Última atualização: maio de 2026</p>

        {[
          { title: '1. Dados que coletamos', content: 'Coletamos nome, e-mail, CPF e endereço IP dos signatários para fins de identificação e validade jurídica das assinaturas. Também coletamos dados de navegação (geolocalização aproximada, user-agent) no momento da assinatura, conforme exigido pela Lei 14.063/2020.' },
          { title: '2. Como usamos seus dados', content: 'Os dados são usados exclusivamente para (a) gerar certificados de assinatura eletrônica com validade jurídica, (b) verificar a identidade dos signatários via código OTP, e (c) compor a trilha de auditoria imutável de cada documento.' },
          { title: '3. Compartilhamento de dados', content: 'Não vendemos ou compartilhamos dados pessoais com terceiros. Os dados são compartilhados apenas com a empresa que enviou o documento para assinatura, como parte do processo de assinatura eletrônica.' },
          { title: '4. Segurança', content: 'Todos os dados são armazenados de forma criptografada. Os documentos são protegidos por hash SHA-256. O acesso ao banco de dados é controlado por Row Level Security (RLS) do Supabase.' },
          { title: '5. Seus direitos (LGPD)', content: 'Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito de acessar, corrigir ou solicitar a exclusão dos seus dados. Entre em contato pelo e-mail privacidade@novosign.com.br.' },
          { title: '6. Cookies', content: 'Utilizamos apenas cookies essenciais para autenticação e manutenção da sessão. Não utilizamos cookies de rastreamento ou publicidade.' },
          { title: '7. Contato', content: 'Para dúvidas sobre privacidade, entre em contato: privacidade@novosign.com.br' },
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
