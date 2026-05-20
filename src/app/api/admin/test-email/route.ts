import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(req: NextRequest) {
  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 })

  const to = req.nextUrl.searchParams.get('to') ?? 'oito7digital@gmail.com'

  try {
    const resend = new Resend(key)
    const result = await resend.emails.send({
      from: 'NovoSign <noreply@novosign.com.br>',
      to,
      subject: 'Teste de email — NovoSign',
      html: '<p>Se você recebeu isso, o Resend está funcionando corretamente! ✅</p>',
    })
    return NextResponse.json({ ok: true, result })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
