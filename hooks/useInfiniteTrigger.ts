"use client";

import { useEffect } from "react";
import { useInView } from "./useInView";

/** Attach `ref` to a sentinel under a list. Calls `onMore` when it scrolls near the viewport. */
export function useInfiniteTrigger(onMore: () => void, active: boolean) {
  const { ref, inView } = useInView<HTMLDivElement>();
  useEffect(() => {
    if (inView && active) onMore();
  }, [inView, active, onMore]);
  return ref;
}
