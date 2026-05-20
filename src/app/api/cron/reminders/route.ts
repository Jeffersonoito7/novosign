import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendSignatureRequestEmail } from '@/lib/notifications/email'
import { sendSignatureRequestWhatsApp } from '@/lib/notifications/whatsapp'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Vercel Cron: roda todo dia às 9h
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = getAdmin()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://novosign.com.br'

  // Buscar signatários pendentes há mais de 24h e menos de 7 dias
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: pendingSigs } = await supabase
    .from('signatories')
    .select('*, documents(title, status, message, expires_at)')
    .eq('status', 'viewed')
    .gte('created_at', since)
    .lte('created_at', threshold)

  if (!pendingSigs?.length) {
    return NextResponse.json({ sent: 0, message: 'Nenhum lembrete necessário' })
  }

  let sent = 0
  for (const sig of pendingSigs) {
    const doc = sig.documents as any
    if (doc?.status !== 'pending') continue

    const signUrl = `${appUrl}/sign/${sig.token}`

    try {
      if (sig.notification_channel === 'email') {
        await sendSignatureRequestEmail({
          to: sig.email,
          signatoryName: sig.name,
          documentTitle: doc.title,
          senderName: 'NovoSign',
          signUrl,
          message: `Lembrete: você ainda não assinou o documento "${doc.title}". Por favor, assine o quanto antes.`,
        })
        sent++
      } else if (sig.notification_channel === 'whatsapp' && sig.phone) {
        await sendSignatureRequestWhatsApp({
          phone: sig.phone,
          signatoryName: sig.name,
          documentTitle: doc.title,
          senderName: 'NovoSign',
          signUrl,
        })
        sent++
      }
    } catch (err) {
      console.error(`Erro ao enviar lembrete para ${sig.email}:`, err)
    }
  }

  return NextResponse.json({ sent, total: pendingSigs.length })
}
