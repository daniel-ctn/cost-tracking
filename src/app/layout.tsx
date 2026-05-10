import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardSquare01Icon,
  PackageIcon,
  File01Icon,
  ProfitIcon,
} from '@hugeicons/core-free-icons'

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

const navLinks = [
  { href: '/', label: 'Dashboard', icon: DashboardSquare01Icon },
  { href: '/products', label: 'Products', icon: PackageIcon },
  { href: '/entries', label: 'Entries', icon: File01Icon },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-background/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto flex h-16 items-center px-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center size-8 rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                <HugeiconsIcon icon={ProfitIcon} className="size-4 text-violet-400" />
              </div>
              <span className="font-semibold text-lg tracking-tight">
                CostTracker
              </span>
            </Link>
            <nav className="flex items-center gap-1 ml-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-lg hover:text-foreground hover:bg-white/[0.04] transition-colors"
                >
                  <HugeiconsIcon icon={link.icon} className="size-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <div className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
