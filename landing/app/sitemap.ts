import type { MetadataRoute } from "next";
import { CLUSTERS, PILLAR, clusterPath } from "@/lib/clusters";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl(PILLAR.path), lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...CLUSTERS.map((cluster) => ({
      url: absoluteUrl(clusterPath(cluster.slug)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
