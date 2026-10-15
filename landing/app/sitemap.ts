import type { MetadataRoute } from "next";
import { CLUSTERS, PILLAR, clusterPath } from "@/lib/clusters";
import { BLOG_PATH, blogPostPath } from "@/lib/blog";
import { getBlogPosts } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const posts = await getBlogPosts();
  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl(PILLAR.path), lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...CLUSTERS.map((cluster) => ({
      url: absoluteUrl(clusterPath(cluster.slug)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl(BLOG_PATH), lastModified, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((post) => ({
      url: absoluteUrl(blogPostPath(post.slug)),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: absoluteUrl("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
