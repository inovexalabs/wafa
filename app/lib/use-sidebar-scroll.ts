"use client";

import { useCallback } from "react";

// Each page renders its own layout, so the sidebar remounts on every
// navigation and would jump back to the top. Remember where it was scrolled
// for the life of the tab and put it back as soon as the new one mounts.
const positions = new Map<string, number>();

export function useSidebarScroll(key: string) {
  return useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;
      node.scrollTop = positions.get(key) ?? 0;
      const save = () => positions.set(key, node.scrollTop);
      node.addEventListener("scroll", save, { passive: true });
      return () => node.removeEventListener("scroll", save);
    },
    [key],
  );
}
