"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Page } from "@/types/api";
import { mergePage } from "@/utils/list";

export interface CursorList<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: unknown;
  hasMore: boolean;
  /** The server stopped the list early because the visitor is signed out. */
  gated: boolean;
  loadMore: () => void;
  reload: () => void;
  mutate: (fn: (items: T[]) => T[]) => void;
}

/**
 * Cursor paginated list. Changing `deps` (a filter, a search term) starts a fresh list.
 * Responses from an earlier generation are dropped, so quick filter changes never mix results.
 */
export function useCursorList<T extends { id: string }>(
  fetchPage: (cursor: string | null, signal: AbortSignal) => Promise<Page<T>>,
  deps: unknown[],
  enabled = true,
): CursorList<T> {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [gated, setGated] = useState(false);
  const [tick, setTick] = useState(0);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const generation = useRef(0);
  const ctrlRef = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const cursorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const gen = ++generation.current;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    busy.current = true;
    cursorRef.current = null;
    setItems([]);
    setNextCursor(null);
    setError(null);
    setGated(false);
    setLoading(true);

    fetchRef
      .current(null, ctrl.signal)
      .then((page) => {
        if (gen !== generation.current) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
        setGated(page.gated === true);
        cursorRef.current = page.nextCursor;
      })
      .catch((e) => {
        if (gen === generation.current && (e as Error)?.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (gen === generation.current) {
          busy.current = false;
          setLoading(false);
        }
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const loadMore = useCallback(() => {
    const cursor = cursorRef.current;
    if (!cursor || busy.current) return;
    const gen = generation.current;
    busy.current = true;
    setLoadingMore(true);
    fetchRef
      .current(cursor, (ctrlRef.current ?? new AbortController()).signal)
      .then((page) => {
        if (gen !== generation.current) return;
        setItems((prev) => mergePage(prev, page.items));
        setNextCursor(page.nextCursor);
        cursorRef.current = page.nextCursor;
      })
      .catch((e) => {
        if (gen === generation.current && (e as Error)?.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (gen === generation.current) {
          busy.current = false;
          setLoadingMore(false);
        }
      });
  }, []);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const mutate = useCallback((fn: (items: T[]) => T[]) => setItems(fn), []);

  return { items, loading, loadingMore, error, hasMore: nextCursor !== null, gated, loadMore, reload, mutate };
}
