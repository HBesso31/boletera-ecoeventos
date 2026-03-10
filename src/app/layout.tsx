import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Boletera EcoEventos — The Gathering",
    template: "%s | Boletera EcoEventos",
  },
  description:
    "La plataforma de boletería oficial para The Gathering y eventos eco-conscientes. Compra tus entradas y registra tu camp.",
  keywords: ["the gathering", "ecoeventos", "boletería", "tickets", "camping", "festival"],
  openGraph: {
    siteName: "Boletera EcoEventos",
    locale: "es_MX",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        {children}
      </body>
    </html>
  )
}
