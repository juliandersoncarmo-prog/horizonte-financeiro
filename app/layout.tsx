import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Horizonte Financeiro',
  description: 'Planejamento financeiro pessoal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="h-screen overflow-hidden bg-bg text-text">
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 overflow-hidden flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
