import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PRSTO — Le copilote carrière IA des cadres dirigeants",
  description:
    "PRSTO est le copilote carrière IA premium pour cadres dirigeants : CV adaptatif, scoring d'offres, préparation d'entretien, et suivi de candidatures.",
  openGraph: {
    title: "PRSTO — Copilote carrière IA pour cadres dirigeants",
    description:
      "Analysez, matchez, postulez. Votre carrière pilotée par l'intelligence artificielle.",
    type: "website",
    locale: "fr_FR",
    siteName: "PRSTO",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRSTO — Copilote carrière IA",
    description:
      "L'IA au service de votre carrière de cadre dirigeant.",
  },
  icons: {
    icon: "/branding/favicon/favicon.ico",
    apple: "/branding/favicon/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${jakartaSans.variable} ${jetbrains.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
