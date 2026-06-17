import type { Metadata } from 'next'
import { DependencyProvider } from '../providers/DependencyProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Proyecto Integrador',
  description: 'Aplicación web',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <DependencyProvider>
          {children}
        </DependencyProvider>
      </body>
    </html>
  )
}
