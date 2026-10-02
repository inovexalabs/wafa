import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getLandingContent, getNewsPostBySlug } from "@/lib/content";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: PageProps<"/news/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsPostBySlug(slug);
  if (!post) return { title: "News & Notices" };
  return {
    title: post.title,
    description: post.body.slice(0, 150),
  };
}

export default async function NewsPostPage({ params }: PageProps<"/news/[slug]">) {
  const { slug } = await params;
  const [content, post] = await Promise.all([
    getLandingContent(),
    getNewsPostBySlug(slug),
  ]);

  if (!post) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pb-28 pt-40">
        <div className="mx-auto max-w-3xl">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
              post.category === "notice" ? "bg-gold/20 text-ink/70" : "bg-brand/10 text-brand"
            }`}
          >
            {post.category === "notice" ? "Notice" : "News"}
          </span>
          <h1 className="mt-4 text-balance font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
            {post.title}
          </h1>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.08em] text-muted">
            {formatDate(post.publishedAt)}
          </p>

          {post.coverImageUrl ? (
            <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl">
              <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
            </div>
          ) : null}

          <div className="mt-8 whitespace-pre-line text-sm leading-relaxed text-muted">
            {post.body}
          </div>
        </div>
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
