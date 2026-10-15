import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock } from "lucide-react";
import BlogCover from "@/components/blog-cover";
import Footer from "@/components/footer";
import JsonLd from "@/components/json-ld";
import Markdown from "@/components/markdown";
import { getBlogPost, getBlogPosts, getLandingContent } from "@/lib/content";
import { BLOG_PATH, blogPostPath, formatPostDate } from "@/lib/blog";
import {
  ORGANIZATION_ID,
  absoluteUrl,
  breadcrumbSchema,
  graph,
  organizationSchema,
  pageMetadata,
  websiteSchema,
  type Breadcrumb,
} from "@/lib/seo";

export const revalidate = 60;

// Published posts are pre-rendered at build; newer ones render on first visit.
export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: blogPostPath(post.slug),
    image: post.coverImageUrl,
    article: {
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      ...(post.authorName ? { authors: [post.authorName] } : {}),
      tags: post.tags,
    },
  });
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const [post, content, all] = await Promise.all([getBlogPost(slug), getLandingContent(), getBlogPosts()]);
  if (!post) notFound();

  const path = blogPostPath(post.slug);
  const pageUrl = absoluteUrl(path);
  const more = all.filter((other) => other.slug !== post.slug).slice(0, 3);
  const crumbs: Breadcrumb[] = [
    { name: "Home", path: "/" },
    { name: "Blog", path: BLOG_PATH },
    { name: post.title, path },
  ];

  return (
    <>
      <JsonLd
        data={graph([
          organizationSchema(content),
          websiteSchema(),
          {
            "@type": "BlogPosting",
            "@id": `${pageUrl}#article`,
            mainEntityOfPage: pageUrl,
            headline: post.title,
            description: post.excerpt,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            ...(post.coverImageUrl ? { image: post.coverImageUrl } : {}),
            ...(post.tags.length ? { keywords: post.tags.join(", ") } : {}),
            author: post.authorName
              ? { "@type": "Person", name: post.authorName }
              : { "@id": ORGANIZATION_ID },
            publisher: { "@id": ORGANIZATION_ID },
            inLanguage: "en",
          },
          breadcrumbSchema(crumbs, pageUrl),
        ])}
      />
      <main id="top" className="flex-1">
        <article className="mx-auto max-w-3xl px-6 pb-16 pt-36">
          <Link href={BLOG_PATH} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand no-underline hover:text-brand-dark">
            <ArrowLeft className="h-3.5 w-3.5" /> All posts
          </Link>

          <header className="mt-6">
            {post.tags.length ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
                {post.tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand">
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
            <h1 className="mt-4 text-balance font-display text-[clamp(1.9rem,4.4vw,3rem)] font-bold leading-[1.12] tracking-tight text-ink">
              {post.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted">{post.excerpt}</p>
            <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line pb-6 text-xs font-medium text-muted">
              <span className="font-semibold text-ink">{post.authorName || "WAFA Group"}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {post.readingMinutes} min read
              </span>
            </p>
          </header>

          {post.coverImageUrl ? (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl border border-line bg-brand/10">
              <BlogCover src={post.coverImageUrl} alt={post.title} sizes="(max-width: 768px) 100vw, 768px" priority />
            </div>
          ) : null}

          <div className="mt-10">
            <Markdown source={post.body} />
          </div>
        </article>

        {more.length ? (
          <section className="border-t border-line bg-cream-soft px-6 py-16">
            <div className="mx-auto max-w-5xl">
              <h2 className="font-display text-xl font-bold text-ink">More from the blog</h2>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {more.map((other) => (
                  <Link
                    key={other.id}
                    href={blogPostPath(other.slug)}
                    className="group flex flex-col gap-3 rounded-2xl border border-line bg-cream p-6 transition-shadow duration-300 hover:shadow-[0_25px_60px_-30px_rgba(20,32,27,0.4)]"
                  >
                    <h3 className="font-display text-base font-bold leading-snug text-ink group-hover:text-brand">{other.title}</h3>
                    <p className="text-xs leading-relaxed text-muted">{other.excerpt}</p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
                      Read <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
