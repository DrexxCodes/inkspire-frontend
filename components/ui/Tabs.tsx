"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
}

/** Accessible tab list with arrow key navigation. Panels are rendered by the caller. */
export function Tabs<T extends string>({ items, value, onChange, label }: { items: TabItem<T>[]; value: T; onChange: (id: T) => void; label: string }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const listRef = useRef<HTMLDivElement | null>(null);
  const [fade, setFade] = useState({ start: false, end: false });

  // Show a soft fade on whichever side has more tabs hidden, so a cut-off tab reads as "scroll me".
  const measure = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const start = el.scrollLeft > 4;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setFade((f) => (f.start === start && f.end === end ? f : { start, end }));
  }, []);

  useEffect(() => {
    measure();
    const el = listRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, items.length]);

  // Keep the selected tab in view (for example when it was picked from elsewhere on the page).
  useEffect(() => {
    const el = listRef.current;
    const tab = refs.current[value];
    if (!el || !tab) return;
    const left = tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [value]);

  const onKey = (e: KeyboardEvent, index: number) => {
    const next = e.key === "ArrowRight" ? index + 1 : e.key === "ArrowLeft" ? index - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const target = items[(next + items.length) % items.length]!;
    onChange(target.id);
    refs.current[target.id]?.focus();
  };
  return (
    <div
      ref={listRef}
      className="tabs"
      role="tablist"
      aria-label={label}
      data-fade-start={fade.start}
      data-fade-end={fade.end}
      onScroll={measure}
    >
      {items.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el;
          }}
          role="tab"
          type="button"
          aria-selected={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          className="tabs__tab"
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function SegmentedControl<T extends string>({ items, value, onChange, label }: { items: { id: T; label: string }[]; value: T; onChange: (id: T) => void; label: string }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {items.map((i) => (
        <button key={i.id} type="button" className={cn("segmented__item")} aria-pressed={value === i.id} onClick={() => onChange(i.id)}>
          {i.label}
        </button>
      ))}
    </div>
  );
}
