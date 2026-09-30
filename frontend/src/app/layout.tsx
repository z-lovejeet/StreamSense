import type { Metadata } from "next"
import { Inter, DM_Serif_Display, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif-display",
  display: "swap",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "StreamSense — Healthy Waters, Healthy Communities",
  description:
    "AI-powered citizen science platform for urban stream health monitoring. Part of the OneAquaHealth IEEE Global Hackathon 2026.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSerif.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              borderRadius: "12px",
              boxShadow:
                "0 4px 12px -2px rgba(82, 76, 68, 0.08), 0 2px 6px -2px rgba(82, 76, 68, 0.04)",
            },
          }}
        />
      </body>
    </html>
  )
}
