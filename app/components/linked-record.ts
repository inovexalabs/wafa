"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** Highlight for the list item a dashboard row linked to. */
export const linkedRecordClass = "bg-brand/[.06] shadow-[inset_3px_0_0_var(--color-brand)]";

/** DOM id a linkable list item renders with, so the page can scroll to it. */
export function linkedRecordId(id: string) {
  return `record-${id}`;
}

/** Reads `?<param>=` straight from the address bar (null on the server). */
export function readLinkedParam(param: string) {
  return typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(param);
}

function subscribeToHistory(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

/**
 * Dashboard rows link to `<list page>?<param>=<id>`. This returns that id (kept after the URL is cleaned
 * up, so the highlight stays) and, once the list is `ready`, scrolls the item rendered with
 * `id={linkedRecordId(id)}` into view.
 *
 * It reads `window.location` rather than `useSearchParams`, so pages need no Suspense boundary and
 * never flash a loading screen; the URL is cleaned with `history.replaceState`, which costs no
 * navigation or server round trip.
 */
export function useLinkedRecord(param: string, ready: boolean) {
  const urlId = useSyncExternalStore(subscribeToHistory, () => readLinkedParam(param), () => null);
  const [focusId, setFocusId] = useState(urlId);
  // Keep the id once the URL is cleaned; adopt it after hydration on a hard load.
  if (urlId && urlId !== focusId) setFocusId(urlId);

  useEffect(() => {
    if (!ready || !focusId) return;
    document.getElementById(linkedRecordId(focusId))?.scrollIntoView({ block: "center" });
    if (readLinkedParam(param)) window.history.replaceState(null, "", window.location.pathname);
  }, [ready, focusId, param]);

  return focusId;
}
