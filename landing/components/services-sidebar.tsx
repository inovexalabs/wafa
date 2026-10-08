import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { CLUSTERS, PILLAR, clusterPath } from "@/lib/clusters";

// Shared by the services guide (/services) and each cluster page; with no
// currentSlug the "All services" entry is the one highlighted.
export default function ServicesSidebar({ currentSlug }: { currentSlug?: string }) {
  const items = [
    { href: PILLAR.path, label: "All services", isCurrent: currentSlug === undefined },
    ...CLUSTERS.map((cluster) => ({
      href: clusterPath(cluster.slug),
      label: cluster.navLabel,
      isCurrent: cluster.slug === currentSlug,
    })),
  ];

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <nav aria-label="Cooperative services" className="rounded-2xl border border-line bg-cream-soft p-5">
        <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
          Our services
        </p>
        <ul className="mt-3 flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={item.isCurrent ? "page" : undefined}
                className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors duration-300 ${
                  item.isCurrent
                    ? "bg-brand font-semibold text-white"
                    : "text-ink/75 hover:bg-brand/10 hover:text-brand"
                }`}
              >
                {item.label}
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
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
  );
}
