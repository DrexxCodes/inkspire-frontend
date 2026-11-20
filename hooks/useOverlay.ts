"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Accessible overlay behaviour: moves focus in, keeps Tab inside, closes on Escape, locks page
 * scroll, hides the page from screen readers and returns focus to the trigger on close.
 */
export function useOverlay(open: boolean, ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    if (!node) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const root = document.getElementById("app-root");
    root?.setAttribute("aria-hidden", "true");
    root?.setAttribute("inert", "");

    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
    const initial = node.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0] ?? node;
    initial.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      root?.removeAttribute("aria-hidden");
      root?.removeAttribute("inert");
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, ref]);
}
