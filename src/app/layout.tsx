// 📘 Day 1: The ROOT layout. It's required, must render <html> and <body>, and
// wraps every page in the app. It's a Server Component, and it never
// re-renders when you navigate between pages.
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { SiteHeader } from "@/components/site-header";
import { WebVitals } from "@/components/web-vitals";
import { baseOpenGraph, site } from "@/lib/site";
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
//
// 📘 Day 5: the root layout holds the DEFAULTS for the whole site. Every page
// gets them, and a page only sets what's different about it (its title,
// description and address). See lessons/day-05-metadata.md §4.
export const metadata: Metadata = {
  // 📘 The site's address. Pages can then write short paths like "/posts", and
  // Next.js turns them into full URLs like "https://devnotes.dev/posts".
  // Google and Slack need full URLs.
  metadataBase: new URL(site.url),
  title: {
    // 📘 Added to every page's title: "About" becomes "About | DevNotes".
    // It only applies to pages in subfolders (app/about, app/posts, …).
    template: `%s | ${site.name}`,
    // 📘 Used when a page sets no title. That's the home page: app/page.tsx is in
    // the same folder as this layout, so the template above doesn't apply to it.
    default: `${site.name}: learn Next.js by building it`,
  },
  description: site.description,
  applicationName: site.name,
  // 📘 Defaults for the link-preview card (Slack, WhatsApp, LinkedIn…). Next.js
  // copies the page's title and description into og:title and og:description.
  // There's no `twitter` field on purpose: Next.js copies Open Graph into the
  // twitter:* tags and picks the card size by itself.
  openGraph: { ...baseOpenGraph, type: "website" },
  // 📘 No `alternates.canonical` here, on purpose. Every page gets this layout's
  // values, so a page that forgot its own canonical would say "my official
  // address is the home page". Each page sets its own instead.
};

// 📘 Day 5: the color of the address bar on phones. It's a separate export
// because the browser needs it before it draws anything. The colors match the
// page background in globals.css, so the bar blends into the page in light and
// dark mode.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light dark",
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
        {/* 📘 Day 11: logs LCP, CLS and INP to the browser console. */}
        <WebVitals />
        {/* 📘 Day 11: next/script. strategy="lazyOnload" = download this file only
            after the page has loaded, when the browser is idle. Good for scripts
            that don't help the visitor see the page (analytics, chat widgets).
            The default, "afterInteractive", loads it a bit earlier. */}
        <Script src="/scripts/page-views.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
