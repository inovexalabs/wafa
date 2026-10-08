"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { scrollToSection, sectionIdFromHref } from "@/lib/site";

// Handles every "/#id" link on the site so the URL never shows a hash:
// on the homepage it scrolls smoothly in place; elsewhere it navigates to "/"
// and then scrolls to the section once it has rendered.
export default function SectionLinks() {
  const router = useRouter();
  const pathname = usePathname();
  const pendingId = useRef<string | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      const id = sectionIdFromHref(anchor.getAttribute("href") ?? "");
      if (!id) return;

      // Capture phase runs before next/link, which skips prevented clicks.
      event.preventDefault();
      if (window.location.pathname === "/") {
        scrollToSection(id);
      } else {
        pendingId.current = id;
        router.push("/");
      }
    }

    // A hash typed or pasted into the address bar on the same page.
    function handleHashChange() {
      const id = window.location.hash.slice(1);
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
      if (id) scrollToSection(id);
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [router]);

  useEffect(() => {
    // A shared link like /#contact still lands on the section, then the hash is
    // dropped. Deferred so it runs after Next.js syncs the URL on hydration,
    // which would otherwise write the hash back.
    const { hash } = window.location;
    const stripHash = window.setTimeout(() => {
      if (!window.location.hash) return;
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    });

    const id = pendingId.current ?? (pathname === "/" && hash ? hash.slice(1) : null);
    pendingId.current = null;

    // The homepage may still be rendering after navigation; retry for ~2s.
    let frame = 0;
    let tries = 0;
    const attempt = () => {
      if (!id || scrollToSection(id) || ++tries > 120) return;
      frame = requestAnimationFrame(attempt);
    };
    frame = requestAnimationFrame(attempt);
    return () => {
      window.clearTimeout(stripHash);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
