import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").origin;
// Cloudflare Turnstile (contact form captcha) loads a script and an iframe.
const turnstileOrigin = "https://challenges.cloudflare.com";

// Static (nonce-free) CSP so pages stay statically rendered. 'unsafe-inline'
// scripts are still needed for Next's inline bootstrap, but third-party script
// origins, plugins, framing and form/base hijacking are all blocked.
const contentSecurityPolicy = [
  "default-src 'self'",
  // va.vercel-scripts.com serves Vercel Analytics outside Vercel (e.g. dev).
  `script-src 'self' 'unsafe-inline' ${turnstileOrigin} https://va.vercel-scripts.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${apiOrigin} ${turnstileOrigin}${isDev ? " ws:" : ""}`,
  `frame-src ${turnstileOrigin}`,
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
];

const nextConfig: NextConfig = {
  // Don't advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      // Photos uploaded from the superadmin landing editor (landing-media bucket).
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
