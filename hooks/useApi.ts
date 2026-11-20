"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ApiState<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
  reload: () => void;
  setData: (updater: T | null | ((prev: T | null) => T | null)) => void;
}

/**
 * Loads one resource. Stale responses are ignored when the inputs change or the component
 * unmounts, and the in flight request is aborted.
 */
export function useApi<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[], enabled = true): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(enabled);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetcherRef
      .current(ctrl.signal)
      .then((d) => {
        if (!ctrl.signal.aborted) setData(d);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted && (e as Error)?.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload, setData };
}
