import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import NavBar from "@/components/NavBar";
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
  title: "ProLaw | Legal Management System",
  description: "Advanced legal practice management for modern law firms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased min-h-screen text-foreground selection:bg-accent/30">
        <NavBar />
        <main className="max-w-[1440px] mx-auto min-h-[calc(100vh-64px)] relative z-10">
          {children}
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
