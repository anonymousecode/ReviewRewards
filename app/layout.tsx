import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ReviewRewards',
  description: 'Track Google review collections and reward your best employees.',
}

import { ThemeProvider } from '@/components/ThemeProvider'
import { SessionTimeout } from '@/components/SessionTimeout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-zinc-200 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionTimeout />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
