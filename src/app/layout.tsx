// Root layout: wraps every page. Holds the <html>/<body> tags and the shared nav.
// This is a Server Component (the default in the app directory).

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FixIt – request a technician",
  description: "Describe your problem, AI suggests the right specialist and priority.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Nav />
        {/* Mobile-first: full width with side padding; capped at a readable width on large screens. */}
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
