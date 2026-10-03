import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Breadcrumb } from "@/lib/seo";

export default function Breadcrumbs({ crumbs }: { crumbs: Breadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="font-semibold text-ink">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link href={crumb.path} className="transition-colors hover:text-brand">
                    {crumb.name}
                  </Link>
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
