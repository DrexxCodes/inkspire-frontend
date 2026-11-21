"use client";

import { useEffect } from "react";
import { isVerticalMove, shouldBlockDrag, type ScrollEdge } from "@/lib/overscroll";

const edge = (el: Element): ScrollEdge => ({ scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight });

/** The touched element and everything above it that can scroll vertically, ending with the page itself. */
function scrollChain(target: EventTarget | null): Element[] {
  const chain: Element[] = [];
  const page = document.scrollingElement ?? document.documentElement;
  for (let el = target instanceof Element ? target : null; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) chain.push(el);
  }
  chain.push(page);
  return chain;
}

/**
 * Stops the "bounce" on touch screens: dragging down at the very top, or up at the very bottom, no longer pulls
 * the whole page (header and all) away to show a blank strip behind it. Anything that can still scroll, a long
 * list or a dialog for example, scrolls as usual. Pull to refresh draws its own spinner, so it is not affected.
 */
export function OverscrollLock() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    let chain: Element[] = [];
    let x = 0;
    let y = 0;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0]!;
      x = t.clientX;
      y = t.clientY;
      chain = scrollChain(e.target);
    };

    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || chain.length === 0) return;
      const t = e.touches[0]!;
      const dx = t.clientX - x;
      const dy = t.clientY - y;
      x = t.clientX;
      y = t.clientY;
      if (!isVerticalMove(dx, dy)) return;
      if (e.cancelable && shouldBlockDrag(chain.map(edge), dy)) e.preventDefault();
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
    };
  }, []);

  return null;
}
