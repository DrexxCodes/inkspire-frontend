"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { worksService } from "@/services/works.service";
import { isApiError } from "@/lib/api/errors";

export interface ContentState {
  chunks: string[];
  loading: boolean;
  done: boolean;
  error: unknown;
  /** True when the author saved a new revision while this person was reading. */
  changed: boolean;
  loadMore: () => void;
  restart: () => void;
}

/**
 * Loads a work a few chunks at a time. The revision id from the first page is sent with later
 * pages so the server can tell us if the work changed mid read (409), instead of mixing versions.
 */
export function useWorkContent(workId: string, enabled = true): ContentState {
  const [chunks, setChunks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [changed, setChanged] = useState(false);
  const [epoch, setEpoch] = useState(0);

  const revision = useRef<string | undefined>(undefined);
  const after = useRef<number | undefined>(undefined);
  const busy = useRef(false);
  const doneRef = useRef(false);
  const gen = useRef(0);

  const fetchNext = useCallback(async () => {
    if (busy.current || doneRef.current) return;
    busy.current = true;
    const g = gen.current;
    setLoading(true);
    try {
      const page = await worksService.content(workId, { after: after.current, revisionId: revision.current });
      if (g !== gen.current) return;
      revision.current ??= page.revisionId;
      setChunks((prev) => [...prev, ...page.chunks.map((c) => c.content)]);
      if (page.nextAfter === null) {
        doneRef.current = true;
        setDone(true);
      } else after.current = page.nextAfter;
      setError(null);
    } catch (e) {
      if (g !== gen.current) return;
      if (isApiError(e) && e.is("CONTENT_CHANGED")) setChanged(true);
      else setError(e);
    } finally {
      if (g === gen.current) {
        busy.current = false;
        setLoading(false);
      }
    }
  }, [workId]);

  useEffect(() => {
    gen.current++;
    revision.current = undefined;
    after.current = undefined;
    busy.current = false;
    doneRef.current = false;
    setChunks([]);
    setDone(false);
    setError(null);
    setChanged(false);
    if (enabled) void fetchNext();
  }, [workId, enabled, epoch, fetchNext]);

  const restart = useCallback(() => setEpoch((n) => n + 1), []);
  return { chunks, loading, done, error, changed, loadMore: () => void fetchNext(), restart };
}
