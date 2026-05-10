import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Cost & Profit Tracker",
  description: "Track product costs and profits",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b bg-card">
          <div className="max-w-6xl mx-auto flex h-14 items-center gap-6 px-6">
            <Link href="/" className="font-semibold text-lg">
              Cost Tracker
            </Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link
                href="/products"
                className="hover:text-foreground transition-colors"
              >
                Products
              </Link>
              <Link
                href="/entries"
                className="hover:text-foreground transition-colors"
              >
                Entries
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
