"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PULL, canPullOn, pullDistance, pullIntent, pullProgress, pullRotation, shouldRefresh } from "@/lib/pull-to-refresh";

const atTop = () => (window.scrollY || document.documentElement.scrollTop || 0) <= 0;

/**
 * True when a pull must not start from this touch: inside a dialog, on a field, or on something that is
 * itself scrolled down (a long list inside a panel, say). Then the finger is meant for that, not for refresh.
 */
function startsInsideSomethingElse(target: EventTarget | null): boolean {
  const start = target instanceof Element ? target : null;
  if (!start) return false;
  if (start.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], .overlay')) return true;
  if (document.querySelector('[aria-modal="true"]')) return true;
  for (let el: Element | null = start; el && el !== document.body; el = el.parentElement) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll") && el.scrollTop > 0) return true;
  }
  return false;
}

interface Gesture {
  x: number;
  y: number;
  state: "pending" | "pulling" | "ignored";
  distance: number;
}

/**
 * Pull to refresh for touch screens. Drag down from the very top of a page and a semicircle with the Inkspire mark
 * slides down from the top and the mark turns as you pull. The page content is pushed down by the same distance
 * (see styles/pull.css), so the semicircle and its labels always sit in clear space and never cover any text. Past the trigger, "Release to" and "refresh" glide in from
 * either side; let go and the mark keeps turning while the page reloads its data.
 *
 * It stays out of the way of normal use: it only starts when the page is already at the top, the first movement
 * is a clear downward drag, and nothing shows until the finger has travelled past a dead zone. Scrolling, sideways
 * swipes, dialogs, text fields and the editor are never affected.
 *
 * "Refresh" remounts the page content, so every screen loads its data again exactly as on a fresh visit. The
 * providers above it (sign in, toasts, install) are not touched, so you stay signed in.
 */
export function PullToRefresh({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [epoch, setEpoch] = useState(0);
  const [status, setStatus] = useState("");
  const node = useRef<HTMLDivElement>(null);
  const allowed = useRef(true);
  allowed.current = canPullOn(pathname);

  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return; // touch screens only

    let gesture: Gesture | null = null;
    let refreshing = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const root = document.documentElement;

    const paint = (distance: number, animate: boolean) => {
      const el = node.current;
      if (!el) return;
      const p = pullProgress(distance);
      clearTimeout(settle);
      el.classList.toggle("ptr--animating", animate);
      // The semicircle slides out from under the top bar and the page content moves down by the same amount.
      el.style.setProperty("--ptr-y", `${distance}px`);
      el.style.setProperty("--ptr-s", String(0.7 + 0.3 * p));
      root.style.setProperty("--ptr-shift", `${distance}px`);
      root.classList.add("ptr-on");
      root.classList.toggle("ptr-anim", animate);
      // "Release to refresh" glides in from both sides once letting go would refresh.
      el.classList.toggle("ptr--ready", !refreshing && shouldRefresh(distance));
      el.style.opacity = String(Math.min(1, distance / 32));
      el.style.setProperty("--ptr-rot", `${pullRotation(distance)}deg`);
    };

    const retract = () => {
      paint(0, true);
      node.current?.classList.remove("ptr--spin", "ptr--ready");
      // Once the page has slid back up, stop transforming it (a transform would trap fixed elements inside it).
      settle = setTimeout(() => root.classList.remove("ptr-on", "ptr-anim"), 340);
    };

    const startRefresh = () => {
      refreshing = true;
      setStatus("Refreshing");
      node.current?.classList.remove("ptr--ready");
      node.current?.classList.add("ptr--spin");
      paint(PULL.hold, true);
      setEpoch((n) => n + 1); // remount the page content, so everything loads again
      timer = setTimeout(() => {
        retract();
        setStatus("");
        refreshing = false;
      }, PULL.minSpinMs);
    };

    const onStart = (e: TouchEvent) => {
      gesture = null;
      if (!allowed.current || refreshing || e.touches.length !== 1) return;
      if (!atTop() || startsInsideSomethingElse(e.target)) return;
      const t = e.touches[0]!;
      gesture = { x: t.clientX, y: t.clientY, state: "pending", distance: 0 };
    };

    const onMove = (e: TouchEvent) => {
      const g = gesture;
      if (!g || g.state === "ignored") return;
      if (e.touches.length !== 1) {
        // A second finger (pinch, two finger swipe) is not a pull.
        if (g.state === "pulling") retract();
        gesture = null;
        return;
      }
      const t = e.touches[0]!;
      const dx = t.clientX - g.x;
      const dy = t.clientY - g.y;

      if (g.state === "pending") {
        const intent = pullIntent(dx, dy);
        if (intent === "undecided") return;
        if (intent === "scroll") {
          g.state = "ignored";
          return;
        }
        g.state = "pulling";
      }

      // The page moved under us, or the finger went back above where it started: hand control back to the browser.
      if (!atTop() || dy < 0) {
        if (g.distance > 0) retract();
        g.state = "ignored";
        return;
      }

      g.distance = pullDistance(dy);
      if (e.cancelable) e.preventDefault(); // no rubber band while pulling
      paint(g.distance, false);
    };

    const onEnd = () => {
      const g = gesture;
      gesture = null;
      if (!g || g.state !== "pulling") return;
      if (shouldRefresh(g.distance)) startRefresh();
      else retract();
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
      clearTimeout(timer);
      clearTimeout(settle);
      root.classList.remove("ptr-on", "ptr-anim");
      root.style.removeProperty("--ptr-shift");
    };
  }, []);

  return (
    <>
      <div ref={node} className="ptr" aria-hidden="true">
        <span className="ptr__label ptr__label--left">Release to</span>
        <div className="ptr__dome">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.png" alt="" draggable={false} />
        </div>
        <span className="ptr__label ptr__label--right">refresh</span>
      </div>
      <div className="visually-hidden" role="status" aria-live="polite">
        {status}
      </div>
      <Fragment key={epoch}>{children}</Fragment>
    </>
  );
}
