"use client";

import { useCallback, useSyncExternalStore } from "react";
import { breakpointForWidth, type Breakpoint } from "@/lib/breakpoints";

export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/** Current layout breakpoint. Defaults to "laptop" during server rendering. */
export function useBreakpoint(): Breakpoint {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("resize", cb);
    return () => window.removeEventListener("resize", cb);
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => breakpointForWidth(window.innerWidth),
    () => "laptop" as Breakpoint,
  );
}
