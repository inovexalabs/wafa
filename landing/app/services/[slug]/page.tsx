import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import Footer from "@/components/footer";
import Faq from "@/components/faq";
import JsonLd from "@/components/json-ld";
import ServicesSidebar from "@/components/services-sidebar";
import { getLandingContent } from "@/lib/content";
import { CLUSTERS, PILLAR, clusterPath, getCluster } from "@/lib/clusters";
import {
  absoluteUrl,
  breadcrumbSchema,
  faqSchema,
  graph,
  organizationSchema,
  pageMetadata,
  webPageSchema,
  websiteSchema,
  type Breadcrumb,
} from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return CLUSTERS.map((cluster) => ({ slug: cluster.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const cluster = getCluster(slug);
  if (!cluster) return {};
  return pageMetadata({
    title: cluster.metaTitle,
    description: cluster.description,
    path: clusterPath(cluster.slug),
  });
}

export default async function ClusterPage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const cluster = getCluster(slug);
  if (!cluster) notFound();

  const content = await getLandingContent();
  const path = clusterPath(cluster.slug);
  const pageUrl = absoluteUrl(path);
  const crumbs: Breadcrumb[] = [
    { name: "Home", path: "/" },
    { name: PILLAR.navLabel, path: PILLAR.path },
    { name: cluster.navLabel, path },
  ];

  return (
    <>
      <JsonLd
        data={graph([
          organizationSchema(content),
          websiteSchema(),
          webPageSchema({ path, name: cluster.title, description: cluster.description }),
          breadcrumbSchema(crumbs, pageUrl),
          faqSchema(cluster.faqs, pageUrl),
        ])}
      />
      <main className="flex-1">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 pt-36 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <article className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
              {cluster.eyebrow}
            </p>
            <h1 className="mt-3 text-balance font-display text-[clamp(1.9rem,4.2vw,2.9rem)] font-bold leading-tight tracking-tight text-ink">
              {cluster.title}
            </h1>
            <p className="mt-6 text-sm leading-relaxed text-muted sm:text-base">{cluster.description}</p>

            <div className="mt-12 flex flex-col gap-12">
              {cluster.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-display text-[clamp(1.3rem,2.4vw,1.7rem)] font-bold leading-tight text-ink">
                    {section.heading}
                  </h2>
                  <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-muted">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {section.points ? (
                    <ul className="mt-5 flex flex-col gap-3">
                      {section.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                            <Check className="h-3 w-3" />
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </article>

          <ServicesSidebar currentSlug={cluster.slug} />
        </div>

        {/* Not "faq": that id belongs to the homepage section the nav links to. */}
        <Faq
          faqs={cluster.faqs}
          id="questions"
          eyebrow={cluster.eyebrow}
          heading="Common questions"
        />
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
