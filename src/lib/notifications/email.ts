import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'NovoSign <noreply@novosign.com.br>'

export async function sendSignatureRequestEmail({
  to,
  signatoryName,
  documentTitle,
  senderName,
  signUrl,
  message,
  expiresAt,
}: {
  to: string
  signatoryName: string
  documentTitle: string
  senderName: string
  signUrl: string
  message?: string
  expiresAt?: string
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `${senderName} solicita sua assinatura — ${documentTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="color:#2563eb;font-size:24px;margin:0">NovoSign</h1>
          <p style="color:#6b7280;font-size:14px">Assinatura Eletrônica com Validade Jurídica</p>
        </div>

        <h2 style="font-size:20px;color:#111827">Olá, ${signatoryName}!</h2>
        <p style="color:#374151">${senderName} solicita a sua assinatura no documento:</p>
        <p style="font-weight:bold;color:#111827;font-size:18px">${documentTitle}</p>

        ${message ? `<div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0"><p style="color:#374151;margin:0">"${message}"</p></div>` : ''}

        ${expiresAt ? `<p style="color:#6b7280;font-size:14px">⏰ Este link expira em: <strong>${new Date(expiresAt).toLocaleDateString('pt-BR')}</strong></p>` : ''}

        <div style="text-align:center;margin:32px 0">
          <a href="${signUrl}" style="background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
            Assinar Documento
          </a>
        </div>

        <p style="color:#9ca3af;font-size:12px;text-align:center">
          Este e-mail foi enviado pelo NovoSign. Ao clicar em "Assinar Documento", você concorda com os termos de uso.<br>
          Se você não conhece este remetente, ignore este e-mail.
        </p>
      </div>
    `,
  })
}

export async function sendOTPEmail({
  to,
  signatoryName,
  code,
  documentTitle,
}: {
  to: string
  signatoryName: string
  code: string
  documentTitle: string
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Seu código de verificação — NovoSign`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h1 style="color:#2563eb">NovoSign</h1>
        <h2>Olá, ${signatoryName}!</h2>
        <p>Use o código abaixo para verificar sua identidade e assinar o documento <strong>${documentTitle}</strong>:</p>
        <div style="background:#f3f4f6;border-radius:12px;padding:32px;text-align:center;margin:24px 0">
          <span style="font-size:48px;font-weight:bold;letter-spacing:16px;color:#111827">${code}</span>
        </div>
        <p style="color:#6b7280;font-size:14px">Este código expira em 10 minutos. Não compartilhe com ninguém.</p>
      </div>
    `,
  })
}

export async function sendSignatureCompletedEmail({
  to,
  name,
  documentTitle,
  downloadUrl,
  verifyUrl,
}: {
  to: string
  name: string
  documentTitle: string
  downloadUrl: string
  verifyUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Documento assinado — ${documentTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h1 style="color:#2563eb">NovoSign</h1>
        <div style="background:#d1fae5;border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="color:#065f46;font-weight:bold;margin:0">✅ Documento assinado com sucesso!</p>
        </div>
        <p>Olá, ${name}!</p>
        <p>O documento <strong>${documentTitle}</strong> foi assinado por todos os assinantes.</p>
        <div style="text-align:center;margin:24px 0;display:flex;gap:16px;justify-content:center">
          <a href="${downloadUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Baixar PDF Assinado
          </a>
          <a href="${verifyUrl}" style="background:#f3f4f6;color:#374151;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Verificar Autenticidade
          </a>
        </div>
      </div>
    `,
  })
}
