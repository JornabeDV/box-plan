import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Oswald, Inter, Bebas_Neue, Space_Grotesk } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

// Tipografía para títulos impactantes - estilo deportivo/fitness
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: ["400"],
})

// Tipografía para headings principales - moderna y geométrica
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["400", "500", "600", "700"],
})

// Tipografía para títulos de secciones - condensada y fuerte
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["300", "400", "500", "600", "700"],
})

// Tipografía para body text - legible y moderna
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Box Plan - Planificación y Seguimiento",
  description: "App PWA para planificación y seguimiento de entrenamientos CrossFit",
  generator: "v0.app",
  manifest: "/manifest.json",
  themeColor: "#059669",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${bebasNeue.variable} ${spaceGrotesk.variable} ${oswald.variable} ${inter.variable} antialiased`}>
        <SessionProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </SessionProvider>
      </body>
    </html>
  )
}