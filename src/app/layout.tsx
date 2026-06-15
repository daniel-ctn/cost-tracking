import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import { HugeiconsIcon } from '@hugeicons/react'
import { ProfitIcon } from '@hugeicons/core-free-icons'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { MainNav } from '@/components/main-nav'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Cost & Profit Tracker',
  description: 'Track product costs and profits',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto flex h-16 items-center px-6">
              <Link href="/" className="flex items-center gap-3 group mr-6 sm:mr-10">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 ring-1 ring-primary/20 group-hover:bg-primary/20 transition-colors">
                  <HugeiconsIcon icon={ProfitIcon} className="size-4 text-primary" />
                </div>
                <span className="hidden sm:inline font-semibold text-lg tracking-tight">
                  CostTracker
                </span>
              </Link>
              <MainNav />
              <div className="ml-auto flex items-center gap-3">
                <span className="hidden sm:block text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
