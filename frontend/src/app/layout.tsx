import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRM AI Loyalty',
  description: 'CRM and AI-powered Loyalty Management System',
}

const fallbackFontVars = {
  '--font-sans': '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
  '--font-geist-mono': '"Cascadia Code", Consolas, "Courier New", monospace',
} as CSSProperties

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased" style={fallbackFontVars}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
