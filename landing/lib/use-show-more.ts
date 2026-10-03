"use client";

import { useState } from "react";

export function useShowMore<T>(items: T[], limit: number) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = items.length > limit;
  const visible = showAll ? items : items.slice(0, limit);
  return { visible, hasMore, showAll, setShowAll };
}
