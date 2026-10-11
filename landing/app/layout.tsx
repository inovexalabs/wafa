import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/navbar";
import ScrollProgress from "@/components/scroll-progress";
import SectionLinks from "@/components/section-links";
import StickyMobileCta from "@/components/sticky-mobile-cta";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const title = "WAFA Group | We Are For All";
const description =
  "WAFA Group is a member-owned savings and credit cooperative built on trust, discipline and shared growth. Save together, borrow responsibly, and build a future for all.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: "%s | WAFA Group",
  },
  description,
  keywords: [
    "WAFA Group",
    "savings and credit cooperative",
    "cooperative Nepal",
    "member savings",
    "microfinance",
    "We Are For All",
  ],
  applicationName: "WAFA Group",
  authors: [{ name: "WAFA Group" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "WAFA Group",
    title,
    description,
    // Images come from app/opengraph-image.tsx; setting `images` here would
    // override that file-based image.
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <ScrollProgress />
        <SectionLinks />
        {/* Lives here, not in each page, so it stays mounted across navigations
            instead of replaying its entrance animation on every page change. */}
        <Navbar />
        <div className="grain-overlay" aria-hidden="true" />
        {children}
        <StickyMobileCta />
        {/* Cookieless page-view analytics, so no consent banner is required. */}
        <Analytics />
      </body>
    </html>
  );
}
