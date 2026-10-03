import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sign in | WAFA",
    template: "%s | WAFA",
  },
  description: "Sign in to your WAFA workspace.",
  robots: {
    index: false,
    follow: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WAFA",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "rounded-2xl! border! border-line! font-sans!",
              title: "text-ink! font-semibold!",
              description: "text-muted!",
            },
          }}
        />
      </body>
    </html>
  );
}
