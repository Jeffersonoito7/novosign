import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'
import { sha256 } from '@/lib/crypto'
import { formatDate } from '@/lib/utils'
import type { Document, Signatory } from '@/types'

function safe(text: string): string {
  return (text ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\x00-\xFF]/g, '?')
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim())
      current = word
    } else {
      current = (current + ' ' + word).trim()
    }
  }
  if (current) lines.push(current.trim())
  return lines
}

export async function generateSignedPDF({
  originalPdfBytes,
  document: doc,
  signatories,
  appUrl,
}: {
  originalPdfBytes: Uint8Array
  document: Document
  signatories: Signatory[]
  appUrl: string
}): Promise<{ pdfBytes: Uint8Array; hash: string }> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const verifyUrl = `${appUrl}/verify/${doc.id}`
  const signedSignatories = signatories.filter(s => s.status === 'signed')

  // ── Rodapé em TODAS as páginas ──────────────────────────────────────────
  const pages = pdfDoc.getPages()
  for (const page of pages) {
    const { width } = page.getSize()
    const footerY = 28

    // Faixa azul fina no rodapé
    page.drawRectangle({
      x: 0, y: 0, width, height: footerY + 4,
      color: rgb(0.95, 0.97, 1),
      borderColor: rgb(0.8, 0.87, 1),
      borderWidth: 0.5,
    })

    page.drawText(safe(`Assinado eletronicamente via NovoSign | ID: ${doc.id} | Lei 14.063/2020`), {
      x: 14, y: footerY - 8, size: 6, font, color: rgb(0.3, 0.4, 0.6),
    })

    // Assinantes resumidos
    const names = signedSignatories.map(s => safe(s.name)).join(', ')
    if (names) {
      page.drawText(safe(`Assinantes: ${names}`), {
        x: 14, y: footerY - 18, size: 5.5, font, color: rgb(0.4, 0.4, 0.5),
      })
    }

    page.drawText(safe(`Verifique em: ${verifyUrl}`), {
      x: 14, y: footerY - 27, size: 5.5, font, color: rgb(0.15, 0.39, 0.94),
    })
  }

  // ── Carimbos de assinatura na última página ──────────────────────────────
  const lastPage = pages[pages.length - 1]
  const { width: lw, height: lh } = lastPage.getSize()

  // Caixa de carimbos no canto inferior direito
  let stampY = lh * 0.25
  const stampX = lw * 0.5
  const stampW = lw * 0.45

  for (const sig of signedSignatories) {
    lastPage.drawRectangle({
      x: stampX, y: stampY - 2,
      width: stampW, height: 46,
      color: rgb(0.96, 0.99, 0.96),
      borderColor: rgb(0.2, 0.6, 0.3),
      borderWidth: 0.8,
    })
    lastPage.drawText(safe(`[ASSINADO] ${sig.name}`), {
      x: stampX + 5, y: stampY + 32, size: 7.5, font: fontBold, color: rgb(0.05, 0.45, 0.1),
    })
    lastPage.drawText(safe(`CPF: ${sig.cpf ?? 'N/I'}`), {
      x: stampX + 5, y: stampY + 21, size: 6.5, font, color: rgb(0.3, 0.3, 0.3),
    })
    lastPage.drawText(safe(`Data: ${sig.signed_at ? formatDate(sig.signed_at) : 'N/I'}`), {
      x: stampX + 5, y: stampY + 11, size: 6.5, font, color: rgb(0.3, 0.3, 0.3),
    })
    lastPage.drawText(safe(`IP: ${sig.ip_address ?? 'N/I'}`), {
      x: stampX + 5, y: stampY + 1, size: 6, font, color: rgb(0.5, 0.5, 0.5),
    })
    stampY += 54
  }

  // ── Página de certificado ─────────────────────────────────────────────────
  const certPage = pdfDoc.addPage([595, 842])
  await buildCertificatePage({ page: certPage, doc, signatories, font, fontBold, appUrl, verifyUrl, pdfDoc })

  const pdfBytes = await pdfDoc.save()
  const hash = sha256(Buffer.from(pdfBytes))
  return { pdfBytes, hash }
}

async function buildCertificatePage({
  page, doc, signatories, font, fontBold, appUrl, verifyUrl, pdfDoc,
}: {
  page: PDFPage
  doc: Document
  signatories: Signatory[]
  font: Awaited<ReturnType<PDFDocument['embedFont']>>
  fontBold: Awaited<ReturnType<PDFDocument['embedFont']>>
  appUrl: string
  verifyUrl: string
  pdfDoc: PDFDocument
}) {
  const { width, height } = page.getSize()
  const blue = rgb(0.15, 0.39, 0.94)
  const green = rgb(0.06, 0.62, 0.35)
  const gray = rgb(0.35, 0.35, 0.35)
  const lightGray = rgb(0.95, 0.95, 0.95)
  const white = rgb(1, 1, 1)

  // Cabeçalho azul
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: blue })
  page.drawText('CERTIFICADO DE ASSINATURA ELETRONICA', {
    x: 30, y: height - 38, size: 17, font: fontBold, color: white,
  })
  page.drawText('Documento assinado com validade juridica - Lei 14.063/2020 e MP 2.200-2/2001', {
    x: 30, y: height - 56, size: 8, font, color: rgb(0.78, 0.88, 1),
  })
  page.drawText(safe(`Emitido por: NovoSign | ${new Date().toLocaleString('pt-BR')}`), {
    x: 30, y: height - 72, size: 7.5, font, color: rgb(0.78, 0.88, 1),
  })

  let y = height - 112

  // ── Dados do documento ────────────────────────────────────────────────────
  page.drawRectangle({ x: 20, y: y - 72, width: width - 40, height: 82, color: lightGray, borderColor: rgb(0.82, 0.82, 0.82), borderWidth: 0.5 })
  page.drawRectangle({ x: 20, y: y - 72, width: 4, height: 82, color: blue })

  page.drawText('IDENTIFICACAO DO DOCUMENTO', { x: 30, y: y + 2, size: 9, font: fontBold, color: blue })
  page.drawText(safe(`Titulo: ${doc.title}`), { x: 30, y: y - 12, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
  page.drawText(safe(`ID unico: ${doc.id}`), { x: 30, y: y - 24, size: 7.5, font, color: gray })
  page.drawText(safe(`Hash SHA-256 original: ${doc.file_hash}`), { x: 30, y: y - 35, size: 6.5, font, color: gray })
  page.drawText(safe(`Criado em: ${formatDate(doc.created_at)}`), { x: 30, y: y - 46, size: 7.5, font, color: gray })
  page.drawText(safe(`URL de verificacao: ${verifyUrl}`), { x: 30, y: y - 57, size: 7, font, color: blue })
  y -= 90

  // ── Assinantes ────────────────────────────────────────────────────────────
  page.drawText('REGISTRO DE ASSINATURAS', { x: 30, y: y + 4, size: 9, font: fontBold, color: blue })
  y -= 14

  for (const sig of signatories) {
    const isSigned = sig.status === 'signed'
    const boxH = isSigned ? 88 : 48
    const statusColor = isSigned ? green : rgb(0.75, 0.35, 0.1)

    page.drawRectangle({ x: 20, y: y - boxH + 10, width: width - 40, height: boxH, color: lightGray, borderColor: rgb(0.82, 0.82, 0.82), borderWidth: 0.5 })
    page.drawRectangle({ x: 20, y: y - boxH + 10, width: 4, height: boxH, color: statusColor })

    // Status badge
    page.drawRectangle({ x: width - 110, y: y - 2, width: 88, height: 16, color: isSigned ? rgb(0.88, 0.98, 0.9) : rgb(0.99, 0.93, 0.86), borderColor: statusColor, borderWidth: 0.5 })
    page.drawText(isSigned ? 'ASSINADO' : 'PENDENTE', { x: width - 100, y: y + 3, size: 8, font: fontBold, color: statusColor })

    page.drawText(safe(sig.name), { x: 32, y: y, size: 10, font: fontBold, color: rgb(0.08, 0.08, 0.08) })
    page.drawText(safe(`E-mail: ${sig.email}`), { x: 32, y: y - 13, size: 7.5, font, color: gray })
    page.drawText(safe(`CPF: ${sig.cpf ?? 'Nao informado'}`), { x: 32, y: y - 23, size: 7.5, font, color: gray })

    if (isSigned && sig.signed_at) {
      page.drawText(safe(`Data/Hora: ${formatDate(sig.signed_at)} (UTC)`), { x: 32, y: y - 35, size: 7.5, font, color: gray })
      page.drawText(safe(`Endereco IP: ${sig.ip_address ?? 'N/I'}`), { x: 32, y: y - 46, size: 7, font, color: gray })
      page.drawText(safe(`Dispositivo: ${(sig.user_agent ?? '').slice(0, 75)}`), { x: 32, y: y - 57, size: 6, font, color: rgb(0.5, 0.5, 0.5) })
      page.drawText(safe(`Canal de verificacao: ${sig.notification_channel?.toUpperCase() ?? 'N/I'} (codigo OTP)`), { x: 32, y: y - 67, size: 6.5, font, color: gray })
    }

    y -= boxH + 10
  }

  // ── QR Code (usa ID do documento — sempre válido) ──────────────────────
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1, errorCorrectionLevel: 'H' })
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrDataUrl.replace('data:image/png;base64,', ''), 'base64'))
  const qrSize = 100
  const qrX = width - qrSize - 30
  const qrY = Math.min(y - 10, 150)

  page.drawRectangle({ x: qrX - 6, y: qrY - 6, width: qrSize + 12, height: qrSize + 24, color: lightGray, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5 })
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize })
  page.drawText('Escanear para', { x: qrX, y: qrY + qrSize + 8, size: 7, font, color: gray })
  page.drawText('verificar autenticidade', { x: qrX - 2, y: qrY + qrSize + 1, size: 7, font, color: gray })

  // Texto legal à esquerda do QR
  const legalX = 30
  const legalY = qrY + qrSize
  page.drawText('VALIDADE JURIDICA', { x: legalX, y: legalY + 5, size: 8, font: fontBold, color: blue })
  const legalLines = [
    'Este documento possui validade juridica plena conforme:',
    '- Lei 14.063/2020 (Assinatura Eletronica Avancada)',
    '- Medida Provisoria 2.200-2/2001 (ICP-Brasil)',
    '- Codigo Civil Brasileiro, Art. 107',
    '',
    'A identidade de cada assinante foi verificada por',
    'codigo OTP enviado ao canal de notificacao',
    'registrado, com captura de IP, data/hora e',
    'dispositivo, formando trilha de auditoria imutavel.',
  ]
  legalLines.forEach((line, i) => {
    page.drawText(safe(line), { x: legalX, y: legalY - 2 - i * 10, size: 7, font: i === 0 || i === 7 ? fontBold : font, color: i === 0 ? rgb(0.1, 0.1, 0.1) : gray })
  })

  // Rodapé
  page.drawLine({ start: { x: 20, y: 45 }, end: { x: width - 20, y: 45 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  page.drawText(safe(`NovoSign - novosign.com.br | Documento ID: ${doc.id}`), { x: 20, y: 32, size: 6.5, font, color: gray })
  page.drawText(safe(`Hash original: ${doc.file_hash}`), { x: 20, y: 22, size: 6, font, color: rgb(0.6, 0.6, 0.6) })
  page.drawText(safe(`Verificacao online: ${verifyUrl}`), { x: 20, y: 12, size: 6.5, font, color: blue })
}
