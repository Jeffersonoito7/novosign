import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'
import { sha256 } from '@/lib/crypto'
import { formatDate } from '@/lib/utils'
import type { Document, Signatory } from '@/types'

function safe(text: string): string {
  return text
    .replace(/✓|✔/g, '[OK]')
    .replace(/✗|✘|✕/g, '[X]')
    .replace(/○|●|•/g, '-')
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

  // Adicionar imagens de assinatura em cada página correspondente
  // (simplificado: carimbos no rodapé da última página do doc original)
  const pages = pdfDoc.getPages()
  const lastPage = pages[pages.length - 1]
  const { width } = lastPage.getSize()

  // Faixa de rodapé com carimbos de assinatura
  let stampY = 60
  for (const sig of signatories.filter(s => s.status === 'signed')) {
    lastPage.drawRectangle({
      x: 20,
      y: stampY - 10,
      width: width - 40,
      height: 28,
      color: rgb(0.97, 0.97, 0.97),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5,
    })
    lastPage.drawText(safe(`[OK] Assinado por: ${sig.name}`), {
      x: 28,
      y: stampY + 10,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.4, 0.1),
    })
    lastPage.drawText(
      safe(`CPF: ${sig.cpf ?? 'N/I'} | IP: ${sig.ip_address ?? 'N/I'} | Em: ${sig.signed_at ? formatDate(sig.signed_at) : ''}`),
      {
        x: 28,
        y: stampY,
        size: 6.5,
        font,
        color: rgb(0.4, 0.4, 0.4),
      }
    )
    stampY += 38
  }

  // Página de certificado
  const certPage = pdfDoc.addPage([595, 842]) // A4
  await buildCertificatePage({
    page: certPage,
    doc,
    signatories,
    font,
    fontBold,
    appUrl,
    pdfDoc,
  })

  const pdfBytes = await pdfDoc.save()
  const hash = sha256(Buffer.from(pdfBytes))
  return { pdfBytes, hash }
}

async function buildCertificatePage({
  page,
  doc,
  signatories,
  font,
  fontBold,
  appUrl,
  pdfDoc,
}: {
  page: PDFPage
  doc: Document
  signatories: Signatory[]
  font: Awaited<ReturnType<PDFDocument['embedFont']>>
  fontBold: Awaited<ReturnType<PDFDocument['embedFont']>>
  appUrl: string
  pdfDoc: PDFDocument
}) {
  const { width, height } = page.getSize()
  const blue = rgb(0.15, 0.39, 0.94)
  const green = rgb(0.06, 0.62, 0.35)
  const gray = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.95, 0.95, 0.95)

  // Cabeçalho
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: blue })
  page.drawText('CERTIFICADO DE ASSINATURA ELETRÔNICA', {
    x: 40, y: height - 35, size: 16, font: fontBold, color: rgb(1, 1, 1),
  })
  page.drawText('NovoSign — Assinatura Eletrônica com Validade Jurídica (Lei 14.063/2020)', {
    x: 40, y: height - 58, size: 9, font, color: rgb(0.8, 0.9, 1),
  })

  let y = height - 110

  // Dados do documento
  page.drawText('DADOS DO DOCUMENTO', { x: 40, y, size: 10, font: fontBold, color: blue })
  y -= 18
  page.drawRectangle({ x: 40, y: y - 8, width: width - 80, height: 60, color: lightGray, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.5 })
  page.drawText(safe(`Titulo: ${doc.title}`), { x: 50, y: y + 34, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
  page.drawText(safe(`ID do Documento: ${doc.id}`), { x: 50, y: y + 20, size: 8, font, color: gray })
  page.drawText(safe(`Criado em: ${formatDate(doc.created_at)}`), { x: 50, y: y + 8, size: 8, font, color: gray })
  page.drawText(safe(`Hash SHA-256 (original): ${doc.file_hash}`), { x: 50, y: y - 4, size: 7, font, color: gray })
  y -= 80

  // Assinantes
  page.drawText('ASSINANTES', { x: 40, y, size: 10, font: fontBold, color: blue })
  y -= 16

  for (const sig of signatories) {
    const isSigned = sig.status === 'signed'
    const statusColor = isSigned ? green : rgb(0.8, 0.4, 0.1)
    const boxHeight = 72

    page.drawRectangle({
      x: 40, y: y - boxHeight + 10, width: width - 80, height: boxHeight,
      color: lightGray, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.5,
    })
    page.drawRectangle({
      x: 40, y: y - boxHeight + 10, width: 4, height: boxHeight,
      color: statusColor,
    })

    page.drawText(safe(`${isSigned ? '[OK]' : '[  ]'} ${sig.name}`), {
      x: 52, y: y, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1),
    })
    page.drawText(safe(`Status: ${isSigned ? 'ASSINADO' : sig.status.toUpperCase()}`), {
      x: 52, y: y - 13, size: 8, font: fontBold, color: statusColor,
    })
    page.drawText(safe(`E-mail: ${sig.email}${sig.cpf ? `  |  CPF: ${sig.cpf}` : ''}`), {
      x: 52, y: y - 25, size: 7.5, font, color: gray,
    })
    if (isSigned && sig.signed_at) {
      page.drawText(safe(`Assinado em: ${formatDate(sig.signed_at)}`), {
        x: 52, y: y - 37, size: 7.5, font, color: gray,
      })
      page.drawText(safe(`IP: ${sig.ip_address ?? 'N/I'}  |  Agente: ${(sig.user_agent ?? '').slice(0, 60)}`), {
        x: 52, y: y - 49, size: 6.5, font, color: gray,
      })
    }
    y -= boxHeight + 8
  }

  // QR Code
  const verifyUrl = `${appUrl}/verify/${doc.signed_file_hash ?? doc.file_hash}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 })
  const qrBase64 = qrDataUrl.replace('data:image/png;base64,', '')
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'))

  const qrSize = 90
  page.drawImage(qrImage, { x: width - 40 - qrSize, y: y - qrSize + 20, width: qrSize, height: qrSize })
  page.drawText('Verificar autenticidade', { x: width - 40 - qrSize, y: y - qrSize + 6, size: 7, font, color: gray })

  // Rodapé jurídico
  y = 60
  page.drawLine({ start: { x: 40, y: y + 30 }, end: { x: width - 40, y: y + 30 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  const disclaimer = 'Este documento foi assinado eletronicamente com validade jurídica conforme a Lei 14.063/2020 e Medida Provisória 2.200-2/2001.'
  const lines = wrapText(disclaimer, 100)
  lines.forEach((line, i) => {
    page.drawText(line, { x: 40, y: y + 18 - i * 11, size: 7, font, color: gray })
  })
  page.drawText(`Verificação: ${verifyUrl}`, { x: 40, y: y - 4, size: 7, font, color: blue })
}
