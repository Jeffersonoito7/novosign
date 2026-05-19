/**
 * POST /api/v1/envelope
 *
 * Cria um documento e envia para assinatura via API Key.
 * Usado por sistemas externos como o UNIAVP.
 *
 * Headers:
 *   Authorization: Bearer ns_live_xxxxx
 *   Content-Type: application/json
 *
 * Body:
 *   {
 *     title: string,
 *     file_url?: string,         // URL pública do PDF (alternativa ao file_base64)
 *     file_base64?: string,      // PDF em base64
 *     message?: string,
 *     signatories: [
 *       { name, email, cpf?, phone?, notification_channel? }
 *     ],
 *     metadata?: object          // dados opcionais para rastrear no seu sistema
 *   }
 *
 * Response 201:
 *   { id, status, signatories: [{ id, name, email, sign_url }] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { sha256 } from '@/lib/crypto'
import { sendSignatureRequestEmail } from '@/lib/notifications/email'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req.headers.get('authorization'))
  if (!auth) {
    return NextResponse.json({ error: 'API Key inválida ou ausente.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })

  const { title, file_url, file_base64, message, signatories, metadata } = body

  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'Campo "title" é obrigatório.' }, { status: 400 })
  }
  if (!file_url && !file_base64) {
    return NextResponse.json({ error: 'Informe "file_url" ou "file_base64".' }, { status: 400 })
  }
  if (!Array.isArray(signatories) || signatories.length === 0) {
    return NextResponse.json({ error: '"signatories" deve ser um array não vazio.' }, { status: 400 })
  }

  const supabase = getAdmin()

  // Verificar créditos
  const { data: company } = await supabase
    .from('companies')
    .select('credits')
    .eq('id', auth.companyId)
    .single()

  if (!company || company.credits < 1) {
    return NextResponse.json(
      { error: 'Saldo insuficiente. Acesse novosign.com.br para comprar créditos.', code: 'NO_CREDITS' },
      { status: 402 }
    )
  }

  // Obter PDF bytes
  let pdfBuffer: Buffer
  try {
    if (file_base64) {
      const base64 = file_base64.replace(/^data:application\/pdf;base64,/, '')
      pdfBuffer = Buffer.from(base64, 'base64')
    } else {
      const res = await fetch(file_url)
      if (!res.ok) throw new Error('Falha ao baixar o PDF da URL informada.')
      pdfBuffer = Buffer.from(await res.arrayBuffer())
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const fileHash = sha256(pdfBuffer)
  const fileName = `${auth.companyId}/api/${Date.now()}_${title.replace(/\s+/g, '_').slice(0, 40)}.pdf`

  const { error: uploadErr } = await supabase.storage
    .from('documents')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf' })

  if (uploadErr) {
    return NextResponse.json({ error: 'Erro ao armazenar o arquivo.' }, { status: 500 })
  }

  // Criar documento
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .insert({
      company_id: auth.companyId,
      title,
      message: message ?? null,
      file_path: fileName,
      file_hash: fileHash,
      status: 'pending',
    })
    .select()
    .single()

  if (docErr || !doc) {
    return NextResponse.json({ error: 'Erro ao criar documento.' }, { status: 500 })
  }

  // Criar signatários
  const sigRows = signatories.map((s: any, i: number) => ({
    document_id: doc.id,
    name: s.name,
    email: s.email,
    phone: s.phone ?? null,
    cpf: s.cpf ?? null,
    sign_order: i + 1,
    notification_channel: s.notification_channel ?? 'email',
  }))

  const { data: createdSigs, error: sigErr } = await supabase
    .from('signatories')
    .insert(sigRows)
    .select()

  if (sigErr || !createdSigs) {
    return NextResponse.json({ error: 'Erro ao criar signatários.' }, { status: 500 })
  }

  // Descontar crédito
  const newBalance = company.credits - 1
  await supabase.from('companies').update({ credits: newBalance }).eq('id', auth.companyId)
  await supabase.from('credit_transactions').insert({
    company_id: auth.companyId,
    type: 'deduction',
    credits: -1,
    balance_after: newBalance,
    description: `[API] Envio do documento: ${title}`,
    document_id: doc.id,
  })

  // Auditoria
  await supabase.from('audit_events').insert({
    document_id: doc.id,
    event_type: 'document_created',
    metadata: { source: 'api', api_key_id: auth.keyId, metadata: metadata ?? null },
  })

  // Enviar notificações
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://novosign.com.br'
  const signatureLinks: Record<string, string> = {}

  for (const sig of createdSigs) {
    const signUrl = `${appUrl}/sign/${sig.token}`
    signatureLinks[sig.id] = signUrl

    try {
      if (sig.notification_channel === 'email') {
        await sendSignatureRequestEmail({
          to: sig.email,
          signatoryName: sig.name,
          documentTitle: doc.title,
          senderName: 'NovoSign',
          signUrl,
          message: doc.message ?? undefined,
        })
      }
    } catch (err) {
      console.error(`Erro ao notificar ${sig.email}:`, err)
    }

    await supabase.from('audit_events').insert({
      document_id: doc.id,
      signatory_id: sig.id,
      event_type: 'document_sent',
      metadata: { channel: sig.notification_channel, source: 'api' },
    })
  }

  return NextResponse.json(
    {
      id: doc.id,
      status: 'pending',
      title: doc.title,
      created_at: doc.created_at,
      signatories: createdSigs.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        status: s.status,
        sign_url: signatureLinks[s.id],
      })),
    },
    { status: 201 }
  )
}
