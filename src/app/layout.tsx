export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Shield Advocates",
  description: "Shield Advocates | Al Hawy & Hassane | Corporate & IP Law Firm",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased min-h-screen text-foreground selection:bg-accent/30 bg-[#0a0f1a]">
        <main className="flex-1 min-h-screen relative z-10 overflow-x-hidden">
          {children}
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
