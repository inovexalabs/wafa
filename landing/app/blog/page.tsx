import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import BlogCover from "@/components/blog-cover";
import Footer from "@/components/footer";
import JsonLd from "@/components/json-ld";
import { getBlogPosts, getLandingContent, type BlogPostSummary } from "@/lib/content";
import { BLOG_PATH, blogPostPath, formatPostDate } from "@/lib/blog";
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

export const revalidate = 60;

const TITLE = "Blog";
const DESCRIPTION =
  "Stories, guides and updates from WAFA Group on saving, borrowing responsibly and growing together as a cooperative.";

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: BLOG_PATH });

const crumbs: Breadcrumb[] = [
  { name: "Home", path: "/" },
  { name: TITLE, path: BLOG_PATH },
];

function PostMeta({ post }: { post: BlogPostSummary }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
      <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" /> {post.readingMinutes} min read
      </span>
    </p>
  );
}

function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
      {tags.slice(0, 3).map((tag) => (
        <li key={tag} className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand">
          {tag}
        </li>
      ))}
    </ul>
  );
}

function FeaturedPost({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={blogPostPath(post.slug)}
      className="group grid overflow-hidden rounded-3xl border border-line bg-cream-soft transition-shadow duration-300 hover:shadow-[0_30px_70px_-35px_rgba(20,32,27,0.45)] md:grid-cols-[1.15fr_1fr]"
    >
      <div className="relative aspect-[16/10] bg-brand/10 md:aspect-auto md:min-h-[340px]">
        {post.coverImageUrl ? (
          <BlogCover src={post.coverImageUrl} alt={post.title} sizes="(max-width: 768px) 100vw, 600px" priority />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(31,103,82,0.25),transparent_60%)]" />
        )}
      </div>
      <div className="flex flex-col gap-4 p-7 sm:p-9">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Latest</p>
        <h2 className="text-balance font-display text-[clamp(1.4rem,2.6vw,2rem)] font-bold leading-tight text-ink">
          {post.title}
        </h2>
        <p className="text-sm leading-relaxed text-muted">{post.excerpt}</p>
        <PostMeta post={post} />
        <Tags tags={post.tags} />
        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-brand">
          Read the post
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={blogPostPath(post.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-cream-soft transition-shadow duration-300 hover:shadow-[0_25px_60px_-30px_rgba(20,32,27,0.4)]"
    >
      {post.coverImageUrl ? (
        <div className="relative aspect-[16/9] bg-brand/10">
          <BlogCover src={post.coverImageUrl} alt={post.title} sizes="(max-width: 640px) 100vw, 360px" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Tags tags={post.tags} />
        <h3 className="font-display text-lg font-bold leading-snug text-ink group-hover:text-brand">{post.title}</h3>
        <p className="text-xs leading-relaxed text-muted">{post.excerpt}</p>
        <div className="mt-auto pt-2">
          <PostMeta post={post} />
        </div>
      </div>
    </Link>
  );
}

export default async function BlogIndexPage() {
  const [content, posts] = await Promise.all([getLandingContent(), getBlogPosts()]);
  const [featured, ...rest] = posts;
  const pageUrl = absoluteUrl(BLOG_PATH);

  return (
    <>
      <JsonLd
        data={graph([
          organizationSchema(content),
          websiteSchema(),
          webPageSchema({
            type: "CollectionPage",
            path: BLOG_PATH,
            name: "WAFA Group Blog",
            description: DESCRIPTION,
            extra: {
              mainEntity: {
                "@type": "Blog",
                name: "WAFA Group Blog",
                url: pageUrl,
                blogPost: posts.map((post) => ({
                  "@type": "BlogPosting",
                  headline: post.title,
                  url: absoluteUrl(blogPostPath(post.slug)),
                  datePublished: post.publishedAt,
                })),
              },
            },
          }),
          breadcrumbSchema(crumbs, pageUrl),
        ])}
      />
      <main id="top" className="flex-1">
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-36">
          <header className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Insights &amp; stories</p>
            <h1 className="mt-3 text-balance font-display text-[clamp(1.9rem,4.2vw,2.9rem)] font-bold leading-tight tracking-tight text-ink">
              The WAFA Blog
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-muted sm:text-base">{DESCRIPTION}</p>
          </header>

          {featured ? (
            <div className="mt-12 flex flex-col gap-10">
              <FeaturedPost post={featured} />
              {rest.length ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-12 rounded-3xl border border-dashed border-line bg-cream-soft px-6 py-16 text-center">
              <p className="font-display text-lg font-bold text-ink">No posts yet</p>
              <p className="mt-2 text-sm text-muted">Our first stories are on the way — check back soon.</p>
            </div>
          )}
        </div>
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
