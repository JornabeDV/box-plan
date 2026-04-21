import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Oswald, Inter, Bebas_Neue, Space_Grotesk } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"
import { ClearCacheScript } from "@/components/clear-cache-script"
import { Header } from "@/components/layout/header"
import "./globals.css"

// Display & Headlines — geometric, tech-forward
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["400", "500", "600", "700"],
})

// Body & Data — precise, readable
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
})

// Condensed titles (legacy, kept for compatibility)
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["300", "400", "500", "600", "700"],
})

// Impact titles (legacy, kept for compatibility)
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: ["400"],
})

export const metadata: Metadata = {
  title: "Box Plan — Planificación y Seguimiento",
  description: "App PWA para planificación y seguimiento de entrenamientos CrossFit",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Box Plan",
  },
  icons: {
    apple: "/icon-192.jpg",
    icon: "/icon-192.jpg",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "application-name": "Box Plan",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#001115",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <ClearCacheScript />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Box Plan" />
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${bebasNeue.variable} ${spaceGrotesk.variable} ${oswald.variable} ${inter.variable} antialiased`}>
          <SessionProvider>
            <div className="min-h-[100dvh] bg-background text-foreground relative overflow-hidden">
              <div className="absolute inset-0 kinetic-grid-bg pointer-events-none" aria-hidden="true" />
              <Header />
              {children}
            </div>
            <Toaster />
          </SessionProvider>
      </body>
    </html>
  )
}
