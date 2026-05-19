import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NovoSign — Assinatura Eletrônica com Validade Jurídica',
  description: 'Assine documentos com validade jurídica. Rápido, seguro e conforme a Lei 14.063/2020.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>{children}</body>
    </html>
  )
}
