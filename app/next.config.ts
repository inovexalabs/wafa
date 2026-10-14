import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Signed receipt, document and certificate links are served from Supabase
// Storage: shown in <iframe>/<img> and fetched for the certificate PDF export.
// If the project moves to a Supabase custom domain, add it here.
const storageOrigin = "https://*.supabase.co";

// Static (nonce-free) CSP: a nonce would force every page to render
// dynamically. 'unsafe-inline' scripts are still needed for Next's inline
// bootstrap, but third-party script origins, plugins, framing and
// form/base hijacking are all blocked.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Landing editor previews show whatever image URL the superadmin pastes.
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${storageOrigin}${isDev ? " ws:" : ""}`,
  `frame-src 'self' blob: ${storageOrigin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // The whole workspace is private; keep every page out of search results.
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

// The API lives on a different root domain in production. Browsers (mobile
// Safari in particular, and increasingly Chrome) block third-party cookies
// by default, so a direct cross-site fetch from the browser to the API can
// never keep the session cookie. Proxying /api/* through this Next.js
// server makes every request same-origin from the browser's point of view,
// so the session cookie is first-party and isn't blocked.
const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // Don't advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
