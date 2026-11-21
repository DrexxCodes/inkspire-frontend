"use client";

import { useEffect } from "react";

/**
 * Blocks pinch and double tap zoom on touch devices so Inkspire feels like an app.
 * Safari on iPhone ignores `user-scalable=no`, so the gesture events are cancelled here as well.
 * Desktop (mouse) browsers are untouched, so Ctrl + scroll and browser zoom still work there.
 */
export function ZoomLock() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const stop = (e: Event) => e.preventDefault();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault(); // two finger pinch
    };

    let lastTap = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTap < 300) e.preventDefault(); // double tap
      lastTap = now;
    };

    // Safari only: gesture events.
    document.addEventListener("gesturestart", stop);
    document.addEventListener("gesturechange", stop);
    document.addEventListener("gestureend", stop);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
      document.removeEventListener("gestureend", stop);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return null;
}
