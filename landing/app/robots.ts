import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The public site has nothing private to hide; the member workspace is a
// separate app. /_next/ stays crawlable so search engines can render pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
