"use client";

import { useEffect, useRef, useState } from "react";

/** True while the element is on screen. Used for infinite scroll sentinels and view counting. */
export function useInView<T extends Element>(rootMargin = "300px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { rootMargin });
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, inView };
}
