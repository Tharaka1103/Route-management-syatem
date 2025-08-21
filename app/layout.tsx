import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css';
import { Toaster } from 'sonner'
import SessionProvider from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Route Management System - RouteBook',
  description: 'Advanced route management and booking system for RouteBook organization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <Toaster richColors position="bottom-right" />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
