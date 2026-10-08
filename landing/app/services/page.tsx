import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Footer from "@/components/footer";
import JsonLd from "@/components/json-ld";
import ServicesSidebar from "@/components/services-sidebar";
import { getLandingContent } from "@/lib/content";
import { CLUSTERS, PILLAR, clusterPath } from "@/lib/clusters";
import {
  absoluteUrl,
  breadcrumbSchema,
  graph,
  organizationSchema,
  pageMetadata,
  webPageSchema,
  websiteSchema,
  type Breadcrumb,
} from "@/lib/seo";

export const metadata = pageMetadata({
  title: PILLAR.metaTitle,
  description: PILLAR.description,
  path: PILLAR.path,
});

const crumbs: Breadcrumb[] = [
  { name: "Home", path: "/" },
  { name: PILLAR.navLabel, path: PILLAR.path },
];

export default async function ServicesGuidePage() {
  const content = await getLandingContent();
  const pageUrl = absoluteUrl(PILLAR.path);

  return (
    <>
      <JsonLd
        data={graph([
          organizationSchema(content),
          websiteSchema(),
          webPageSchema({
            type: "CollectionPage",
            path: PILLAR.path,
            name: PILLAR.title,
            description: PILLAR.description,
            extra: {
              mainEntity: {
                "@type": "ItemList",
                itemListElement: CLUSTERS.map((cluster, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: cluster.title,
                  url: absoluteUrl(clusterPath(cluster.slug)),
                })),
              },
            },
          }),
          breadcrumbSchema(crumbs, pageUrl),
        ])}
      />
      <main className="flex-1">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 pb-24 pt-36 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <article className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{PILLAR.eyebrow}</p>
            <h1 className="mt-3 text-balance font-display text-[clamp(1.9rem,4.2vw,2.9rem)] font-bold leading-tight tracking-tight text-ink">
              {PILLAR.title}
            </h1>
            <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-muted sm:text-base">
              {PILLAR.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {CLUSTERS.map((cluster) => (
                <Link
                  key={cluster.slug}
                  href={clusterPath(cluster.slug)}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-cream-soft p-6 transition-shadow sm:p-7 sm:odd:last:col-span-2 duration-300 hover:shadow-[0_25px_60px_-30px_rgba(20,32,27,0.4)]"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
                    {cluster.eyebrow}
                  </p>
                  <h2 className="mt-3 font-display text-lg font-bold leading-snug text-ink">
                    {cluster.title}
                  </h2>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">{cluster.summary}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    Read the guide
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-12 flex flex-col gap-12">
              {PILLAR.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-display text-[clamp(1.3rem,2.4vw,1.7rem)] font-bold leading-tight text-ink">
                    {section.heading}
                  </h2>
                  <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-muted">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <ServicesSidebar />
        </div>
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
