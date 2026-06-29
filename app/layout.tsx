import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Horizonte Financeiro',
  description: 'Planejamento financeiro pessoal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="h-screen overflow-hidden bg-bg text-text">
        {children}
      </body>
    </html>
  )
}
