"use client";

import { useEffect } from "react";
import { worksService } from "@/services/works.service";

const DWELL_MS = 8000;

/** Counts a view only after the page stays visible for a few seconds, so bounces do not count. */
export function useViewTracking(workId: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      timer ??= setTimeout(() => worksService.recordView(workId).catch(() => undefined), DWELL_MS);
    };
    const stop = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
    };
    const onVis = () => (document.visibilityState === "visible" ? start() : stop());
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [workId, enabled]);
}
