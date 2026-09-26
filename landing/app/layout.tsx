import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import ScrollProgress from "@/components/scroll-progress";
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
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "WAFA Group" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/icon-512.png"],
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
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
