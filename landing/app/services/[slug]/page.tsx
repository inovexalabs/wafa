import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Cta from "@/components/cta";
import Faq from "@/components/faq";
import Breadcrumbs from "@/components/breadcrumbs";
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
  const related = cluster.related
    .map((relatedSlug) => getCluster(relatedSlug))
    .filter((item) => item !== undefined);

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
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 pt-36">
          <Breadcrumbs crumbs={crumbs} />
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-brand">
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

        {/* Not "faq": that id belongs to the homepage section the nav links to. */}
        <Faq
          faqs={cluster.faqs}
          id="questions"
          eyebrow={cluster.eyebrow}
          heading="Common questions"
        />

        <section className="px-6 pb-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Keep reading</p>
            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={clusterPath(item.slug)}
                  className="group flex flex-col rounded-2xl border border-line bg-cream-soft p-6 transition-shadow duration-300 hover:shadow-[0_25px_60px_-30px_rgba(20,32,27,0.4)]"
                >
                  <p className="font-display text-base font-bold text-ink">{item.title}</p>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">{item.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    Read the guide
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
              <Link
                href={PILLAR.path}
                className="flex flex-col justify-center rounded-2xl border border-dashed border-line p-6 transition-colors duration-300 hover:border-brand hover:text-brand"
              >
                <p className="font-display text-base font-bold text-ink">All cooperative services</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Back to the full services guide.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <Cta content={content.cta} />
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
