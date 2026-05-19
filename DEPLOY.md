# NovoSign — Guia de Deploy em Produção

## novosign.com.br

---

## 1. Supabase (banco + storage)

### 1.1 Criar projeto
1. Acesse supabase.com → New Project
2. Nome: `novosign-prod`
3. Guarde a senha do banco (você vai precisar)
4. Região: **South America (São Paulo)**

### 1.2 Executar migrations
No Supabase → SQL Editor, execute os arquivos nesta ordem:
```
supabase/migrations/001_initial.sql
supabase/migrations/002_credits.sql
supabase/migrations/003_api_keys.sql
```

### 1.3 Criar bucket de storage
Supabase → Storage → New Bucket:
- Nome: `documents`
- Público: **NÃO** (privado)
- File size limit: 20 MB
- Allowed MIME types: `application/pdf, image/png, image/jpeg`

### 1.4 Copiar credenciais
Supabase → Project Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon public
- `SUPABASE_SERVICE_ROLE_KEY` → service_role (secret)

---

## 2. Resend (e-mail)

1. Acesse resend.com → Create Account
2. Domains → Add Domain → `novosign.com.br`
3. Configurar os DNS no seu provedor:
   - Adicionar os registros TXT/MX que o Resend mostrar
4. Após verificação → API Keys → Create API Key
5. Copiar: `RESEND_API_KEY`
6. No arquivo `src/lib/notifications/email.ts`, alterar:
   ```
   const FROM = 'NovoSign <noreply@novosign.com.br>'
   ```

---

## 3. Stripe (pagamentos)

### 3.1 Criar conta
1. Acesse dashboard.stripe.com
2. Ativar conta para Brasil (CPF/CNPJ da empresa)

### 3.2 Copiar chaves
Stripe → Developers → API Keys:
- `STRIPE_SECRET_KEY` → Secret key (sk_live_...)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Publishable key (pk_live_...)

### 3.3 Configurar Webhook
Stripe → Developers → Webhooks → Add endpoint:
- URL: `https://novosign.com.br/api/webhooks/stripe`
- Evento: `checkout.session.completed`
- Copiar o **Signing secret**: `STRIPE_WEBHOOK_SECRET`

---

## 4. GitHub + Vercel (deploy)

### 4.1 Criar repositório
```bash
cd /Users/jeffersonsoares/novosign
git init
git add .
git commit -m "feat: NovoSign MVP com sistema de créditos e API v1"
git remote add origin https://github.com/oito7digital/novosign.git
git push -u origin main
```

### 4.2 Deploy na Vercel
1. Acesse vercel.com → New Project → Import do GitHub
2. Selecione o repositório `novosign`
3. Framework: **Next.js** (detectado automaticamente)
4. Em **Environment Variables**, adicionar:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://novosign.com.br
```

5. Clique em **Deploy**

### 4.3 Configurar domínio novosign.com.br
1. Vercel → Project → Settings → Domains
2. Adicionar: `novosign.com.br` e `www.novosign.com.br`
3. No seu provedor de domínio (Registro.br ou similar), configurar:

```
Tipo    Nome    Valor
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

4. Aguardar propagação (até 24h, geralmente menos de 1h)

---

## 5. Integração com UNIAVP

Após o deploy, no dashboard do NovoSign:

1. Criar conta da empresa UNIAVP (ou usar a conta principal)
2. Ir em **API & Integrações** → Criar API Key com nome "UNIAVP Produção"
3. **Copiar a chave** (exibida apenas uma vez)
4. Configurar no UNIAVP:

```env
NOVOSIGN_API_KEY=ns_live_xxxxxxxx
NOVOSIGN_API_URL=https://novosign.com.br
```

5. (Opcional) Registrar Webhook para receber notificação quando o contrato for assinado:
   - URL: `https://uniavp.com.br/api/novosign/webhook`
   - Evento: `document.completed`

### Exemplo de chamada do UNIAVP ao NovoSign:
```javascript
// Quando aluno confirma matrícula:
const response = await fetch('https://novosign.com.br/api/v1/envelope', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.NOVOSIGN_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: `Contrato de Matrícula — ${aluno.nome}`,
    file_url: `https://uniavp.com.br/contratos/${aluno.id}.pdf`,
    signatories: [
      {
        name: aluno.nome,
        email: aluno.email,
        cpf: aluno.cpf,
        notification_channel: 'email',
      }
    ],
    metadata: { aluno_id: aluno.id, curso: aluno.curso },
  }),
})
const envelope = await response.json()
// envelope.id → salvar no banco do UNIAVP para consultas futuras
// envelope.signatories[0].sign_url → link para o aluno assinar
```

---

## 6. Checklist final antes de ir ao ar

- [ ] Migrations executadas no Supabase
- [ ] Bucket `documents` criado (privado)
- [ ] Domínio `novosign.com.br` verificado no Resend
- [ ] Webhook do Stripe apontando para produção
- [ ] Todas as env vars configuradas na Vercel
- [ ] Domínio propagado e HTTPS funcionando
- [ ] Testar fluxo completo: criar conta → upload → enviar → assinar → verificar
- [ ] API Key do UNIAVP criada e testada
- [ ] Webhook do UNIAVP registrado e validado
