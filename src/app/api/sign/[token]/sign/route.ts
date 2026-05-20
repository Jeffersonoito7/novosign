import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
import { generateSignedPDF } from '@/lib/pdf/generate'
import { sendSignatureCompletedEmail } from '@/lib/notifications/email'
import { dispatchWebhook } from '@/lib/api-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await req.json()
  const { signatureImageBase64, geolocation } = body

  const supabase = getAdmin()
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? ''

  const { data: sig } = await supabase
    .from('signatories')
    .select('*, documents(*, signatories(*))')
    .eq('token', token)
    .single()

  if (!sig) return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
  if (sig.status === 'signed') return NextResponse.json({ error: 'Já assinado' }, { status: 409 })

  const doc = sig.documents

  // Salvar imagem da assinatura no storage
  let signatureImagePath: string | null = null
  if (signatureImageBase64) {
    const base64Data = signatureImageBase64.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')
    const imagePath = `signatures/${sig.document_id}/${sig.id}.png`
    const { error: imgErr } = await supabase.storage
      .from('documents')
      .upload(imagePath, imageBuffer, { contentType: 'image/png', upsert: true })

    if (!imgErr) signatureImagePath = imagePath
  }

  // Atualizar assinante
  await supabase.from('signatories').update({
    status: 'signed',
    signed_at: new Date().toISOString(),
    ip_address: ip,
    user_agent: userAgent,
    geolocation: geolocation ?? null,
    signature_image_path: signatureImagePath,
  }).eq('id', sig.id)

  // Evento de auditoria
  await supabase.from('audit_events').insert({
    document_id: sig.document_id,
    signatory_id: sig.id,
    event_type: 'signed',
    ip_address: ip,
    user_agent: userAgent,
    geolocation: geolocation ?? null,
  })

  // Verificar se todos assinaram
  const { data: allSignatories } = await supabase
    .from('signatories')
    .select('*')
    .eq('document_id', sig.document_id)

  const updatedSignatories = (allSignatories ?? []).map((s: any) =>
    s.id === sig.id ? { ...s, status: 'signed', signed_at: new Date().toISOString(), ip_address: ip, user_agent: userAgent } : s
  )

  const allSigned = updatedSignatories.every((s: any) => s.status === 'signed')

  if (allSigned) {
    // Gerar PDF assinado
    try {
      const { data: fileData } = await supabase.storage.from('documents').download(doc.file_path)
      if (fileData) {
        const originalBytes = new Uint8Array(await fileData.arrayBuffer())
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

        const { pdfBytes, hash } = await generateSignedPDF({
          originalPdfBytes: originalBytes,
          document: doc,
          signatories: updatedSignatories,
          appUrl,
        })

        const signedPath = `${doc.file_path.replace('.pdf', '')}_signed.pdf`
        await supabase.storage.from('documents').upload(signedPath, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        })

        await supabase.from('documents').update({
          status: 'completed',
          signed_file_path: signedPath,
          signed_file_hash: hash,
        }).eq('id', sig.document_id)

        await supabase.from('audit_events').insert({
          document_id: sig.document_id,
          event_type: 'completed',
          metadata: { signed_hash: hash },
        })

        // Disparar webhook para sistemas integrados (ex: UNIAVP)
        dispatchWebhook(doc.company_id, 'document.completed', {
          document_id: doc.id,
          title: doc.title,
          signed_file_hash: hash,
          verify_url: `${appUrl}/verify/${hash}`,
          download_url: `${appUrl}/api/documents/${doc.id}/pdf`,
          signatories: updatedSignatories.map((s: any) => ({
            id: s.id, name: s.name, email: s.email,
            signed_at: s.signed_at, ip_address: s.ip_address,
          })),
        }).catch(() => {})

        // Notificar todos com o PDF final
        const verifyUrl = `${appUrl}/verify/${hash}`
        const downloadUrl = `${appUrl}/api/documents/${sig.document_id}/pdf`

        for (const s of updatedSignatories) {
          try {
            await sendSignatureCompletedEmail({
              to: s.email,
              name: s.name,
              documentTitle: doc.title,
              downloadUrl,
              verifyUrl,
            })
          } catch (emailErr) {
            console.error('Erro ao enviar email de conclusão:', emailErr)
          }

          if (s.notification_channel === 'whatsapp' && s.phone) {
            try {
              const { sendCompletedWhatsApp } = await import('@/lib/notifications/whatsapp')
              await sendCompletedWhatsApp({
                phone: s.phone,
                name: s.name,
                documentTitle: doc.title,
                downloadUrl,
                verifyUrl,
              })
            } catch (waErr) {
              console.error('Erro ao enviar WhatsApp de conclusão:', waErr)
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao gerar PDF assinado:', err)
    }
  }

  return NextResponse.json({ ok: true, allSigned })
}
