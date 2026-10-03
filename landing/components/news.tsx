"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { NewsPost } from "@/lib/content";
import { useShowMore } from "@/lib/use-show-more";

const LIMIT = 4;

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

export default function News({ posts }: { posts: NewsPost[] }) {
  const { visible, hasMore, showAll, setShowAll } = useShowMore(posts, LIMIT);

  return (
    <section id="news" className="bg-cream-soft px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Stay informed</p>
          <h2 className="mt-3 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink">
            News & Notices
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Updates, announcements, and official notices from WAFA Group.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="mt-14 text-center text-sm text-muted">
            No news or notices yet — check back soon.
          </p>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {visible.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: (i % 2) * 0.08 }}
                className="overflow-hidden rounded-2xl border border-line bg-cream"
              >
                {post.coverImageUrl ? (
                  <div className="relative aspect-[16/9] w-full">
                    <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
                  </div>
                ) : null}
                <div className="p-6">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                      post.category === "notice" ? "bg-gold/20 text-ink/70" : "bg-brand/10 text-brand"
                    }`}
                  >
                    {post.category === "notice" ? "Notice" : "News"}
                  </span>
                  <p className="mt-3 font-display text-base font-bold text-ink">{post.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{excerpt(post.body)}</p>
                  <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                    {formatDate(post.publishedAt)}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {hasMore ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-5 py-2.5 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-brand/10 hover:text-brand"
            >
              {showAll ? "Show less" : `View all (${posts.length})`}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
