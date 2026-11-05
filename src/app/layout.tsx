// 📘 Day 1: The ROOT layout. It's required, must render <html> and <body>, and
// wraps every page in the app. It's a Server Component, and it never
// re-renders when you navigate between pages.
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// 📘 next/font downloads fonts at BUILD time and self-hosts them.
// No request to Google from the browser, and no layout shift.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 📘 Static metadata becomes <title> and <meta> tags in <head>.
// This is only a starting point. Day 5 is entirely about the Metadata API.
export const metadata: Metadata = {
  title: "DevNotes",
  description: "A developer blog for learning Next.js, one day at a time.",
};

// 📘 LayoutProps<"/"> is a global type generated from your route tree.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
          {children}
        </main>
        <footer className="border-t border-foreground/10 py-6 text-center text-xs text-foreground/50">
          Built while learning Next.js 16 · DevNotes
        </footer>
      </body>
    </html>
  );
}
