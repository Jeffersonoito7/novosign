const EVOLUTION_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE ?? 'novosign'

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    console.warn('WhatsApp não configurado (EVOLUTION_API_URL ou EVOLUTION_API_KEY ausentes)')
    return false
  }

  const number = phone.replace(/\D/g, '')
  const fullNumber = number.startsWith('55') ? number : `55${number}`

  try {
    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
      body: JSON.stringify({ number: fullNumber, text: message }),
    })
    return res.ok
  } catch (err) {
    console.error('Erro ao enviar WhatsApp:', err)
    return false
  }
}

export async function sendSignatureRequestWhatsApp({
  phone,
  signatoryName,
  documentTitle,
  senderName,
  signUrl,
}: {
  phone: string
  signatoryName: string
  documentTitle: string
  senderName: string
  signUrl: string
}) {
  const message = `✍️ *${senderName}* solicita sua assinatura no documento:

📄 *${documentTitle}*

Clique no link abaixo para assinar com segurança:
${signUrl}

_Powered by NovoSign · Assinatura Eletrônica com Validade Jurídica_`

  return sendWhatsAppMessage(phone, message)
}

export async function sendOTPWhatsApp({
  phone,
  signatoryName,
  code,
  documentTitle,
}: {
  phone: string
  signatoryName: string
  code: string
  documentTitle: string
}) {
  const message = `🔐 *NovoSign* — Código de verificação

Olá, *${signatoryName}*!

Seu código para assinar o documento *${documentTitle}*:

*${code}*

Este código expira em 10 minutos. Não compartilhe com ninguém.`

  return sendWhatsAppMessage(phone, message)
}

export async function sendCompletedWhatsApp({
  phone,
  name,
  documentTitle,
  downloadUrl,
  verifyUrl,
}: {
  phone: string
  name: string
  documentTitle: string
  downloadUrl: string
  verifyUrl: string
}) {
  const message = `✅ *Documento assinado com sucesso!*

Olá, *${name}*!

O documento *${documentTitle}* foi assinado por todos os assinantes.

📥 Baixar PDF: ${downloadUrl}
🔍 Verificar autenticidade: ${verifyUrl}

_NovoSign · Lei 14.063/2020_`

  return sendWhatsAppMessage(phone, message)
}
