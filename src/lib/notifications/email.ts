import { Resend } from 'resend'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY não configurada')
  return new Resend(key)
}

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
  return getResend().emails.send({
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
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `NovoSign: confirme sua identidade para assinar`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff">
        <div style="margin-bottom:24px">
          <span style="font-size:22px;font-weight:bold;color:#2563eb">Novo</span><span style="font-size:22px;font-weight:bold;color:#10b981">Sign</span>
        </div>
        <p style="font-size:16px;color:#111827;margin-bottom:8px">Olá, <strong>${signatoryName}</strong>!</p>
        <p style="font-size:15px;color:#374151;margin-bottom:24px">
          Você foi solicitado a assinar o documento <strong>"${documentTitle}"</strong>.
          Use o código abaixo para confirmar sua identidade:
        </p>
        <div style="background:#f0f9ff;border:2px solid #bfdbfe;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px">
          <p style="font-size:13px;color:#1d4ed8;margin:0 0 12px 0;font-weight:600;letter-spacing:1px">CÓDIGO DE VERIFICAÇÃO</p>
          <p style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#1e3a8a;margin:0;font-family:monospace">${code}</p>
          <p style="font-size:12px;color:#6b7280;margin:12px 0 0 0">Válido por 10 minutos</p>
        </div>
        <p style="font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:16px">
          Se você não solicitou esta assinatura, ignore este e-mail.<br>Nunca compartilhe este código.
        </p>
        <p style="font-size:12px;color:#9ca3af;margin-top:16px">NovoSign · Lei 14.063/2020</p>
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
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Documento assinado com sucesso — ${documentTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff">
        <div style="margin-bottom:20px">
          <span style="font-size:22px;font-weight:bold;color:#2563eb">Novo</span><span style="font-size:22px;font-weight:bold;color:#10b981">Sign</span>
        </div>
        <div style="background:#d1fae5;border-radius:8px;padding:14px 16px;margin-bottom:20px">
          <p style="color:#065f46;font-weight:bold;margin:0;font-size:15px">Documento assinado com sucesso!</p>
        </div>
        <p style="font-size:15px;color:#111827">Olá, <strong>${name}</strong>!</p>
        <p style="font-size:15px;color:#374151">O documento <strong>"${documentTitle}"</strong> foi assinado por todos os assinantes e está pronto para download.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0">
          <tr>
            <td align="center">
              <a href="${downloadUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;margin-bottom:12px">
                Baixar PDF Assinado
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:8px">
              <a href="${verifyUrl}" style="display:inline-block;background:#f3f4f6;color:#374151;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
                Verificar Autenticidade
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:8px">
          NovoSign · Assinatura Eletrônica com Validade Jurídica · Lei 14.063/2020
        </p>
      </div>
    `,
  })
}
