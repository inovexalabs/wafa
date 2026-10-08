import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, ChevronRight } from "lucide-react";
import Footer from "@/components/footer";
import Cta from "@/components/cta";
import Faq from "@/components/faq";
import JsonLd from "@/components/json-ld";
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

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <nav
              aria-label="Cooperative services"
              className="rounded-2xl border border-line bg-cream-soft p-5"
            >
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
                Our services
              </p>
              <ul className="mt-3 flex flex-col gap-1">
                {CLUSTERS.map((item) => {
                  const isCurrent = item.slug === cluster.slug;
                  return (
                    <li key={item.slug}>
                      <Link
                        href={clusterPath(item.slug)}
                        aria-current={isCurrent ? "page" : undefined}
                        className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors duration-300 ${
                          isCurrent
                            ? "bg-brand font-semibold text-white"
                            : "text-ink/75 hover:bg-brand/10 hover:text-brand"
                        }`}
                      >
                        {item.navLabel}
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={PILLAR.path}
                className="mt-3 flex items-center gap-1 border-t border-line px-3 pt-4 text-xs font-semibold text-brand"
              >
                View all services
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </nav>

            <div className="mt-6 rounded-2xl bg-brand p-6 text-white">
              <p className="font-display text-base font-bold">Have a question?</p>
              <p className="mt-2 text-xs leading-relaxed text-white/80">
                Our team can walk you through membership, savings and loans.
              </p>
              <Link
                href="/#contact"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand transition-colors duration-300 hover:bg-cream"
              >
                Contact us
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>

        {/* Not "faq": that id belongs to the homepage section the nav links to. */}
        <Faq
          faqs={cluster.faqs}
          id="questions"
          eyebrow={cluster.eyebrow}
          heading="Common questions"
        />

        <Cta content={content.cta} />
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
