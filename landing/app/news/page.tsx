import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getLandingContent, getNewsPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "News & Notices",
  description: "Latest news and notices from WAFA Group.",
};

function excerpt(body: string, length = 150) {
  const clean = body.trim();
  return clean.length > length ? `${clean.slice(0, length).trim()}…` : clean;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function NewsPage() {
  const [content, posts] = await Promise.all([getLandingContent(), getNewsPosts()]);

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pb-28 pt-40">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Stay informed</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
            News & Notices
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            Updates, announcements, and official notices from WAFA Group.
          </p>

          {posts.length === 0 ? (
            <p className="mt-16 text-sm text-muted">No news or notices yet — check back soon.</p>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.slug}`}
                  className="group overflow-hidden rounded-2xl border border-line bg-cream-soft transition-colors duration-300 hover:bg-cream-soft/70"
                >
                  {post.coverImageUrl ? (
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                        post.category === "notice"
                          ? "bg-gold/20 text-ink/70"
                          : "bg-brand/10 text-brand"
                      }`}
                    >
                      {post.category === "notice" ? "Notice" : "News"}
                    </span>
                    <p className="mt-3 font-display text-base font-bold text-ink group-hover:text-brand">
                      {post.title}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {excerpt(post.body)}
                    </p>
                    <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                      {formatDate(post.publishedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
