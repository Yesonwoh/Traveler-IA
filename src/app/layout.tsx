import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://traveler-ia.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Traveler IA — Viaja más, gastando menos",
    template: "%s — Traveler IA",
  },
  description:
    "Planifica tu viaje con IA: itinerarios low-cost, trucos de ahorro reales, mapa con todo marcado y tus reservas organizadas en un mismo sitio.",
  keywords: [
    "viajes baratos",
    "planificador de viajes",
    "itinerario con IA",
    "viajar low cost",
    "mochilero",
  ],
  applicationName: "Traveler IA",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    siteName: "Traveler IA",
    title: "Traveler IA — Viaja más, gastando menos",
    description:
      "Dinos a dónde vas y la IA optimiza tu ruta para exprimir cada céntimo. Itinerarios, mapa y reservas en un solo sitio.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Traveler IA — Viaja más, gastando menos",
    description: "Planifica viajes low-cost con IA: itinerarios, mapa y reservas en un solo sitio.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
