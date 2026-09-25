import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import ScrollProgress from "@/components/scroll-progress";
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

export const metadata: Metadata = {
  title: "WAFA Group | We Are For All",
  description:
    "WAFA Group is a member-owned savings and credit cooperative built on trust, discipline and shared growth. Save together, borrow responsibly, and build a future for all.",
  icons: {
    icon: "/logo.jpeg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}
