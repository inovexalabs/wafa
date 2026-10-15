export const BLOG_PATH = "/blog";

export function blogPostPath(slug: string) {
  return `${BLOG_PATH}/${slug}`;
}

export function formatPostDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// next/image only optimizes hosts allow-listed in next.config.ts (uploads
// from the superadmin editor land in Supabase's public landing-media bucket).
export function isOptimizableImage(url: string) {
  try {
    const { protocol, hostname, pathname } = new URL(url);
    return (
      protocol === "https:" &&
      hostname.endsWith(".supabase.co") &&
      pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}
