"use client";

import { useEffect, useState } from "react";
import { moderationService } from "@/services/moderation.service";
import { splitBlocks } from "@/utils/content";
import { ErrorState, Spinner } from "@/components/ui/feedback";
import { ResponsiveDrawer } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";

/** Lets a moderator read the exact revision under review, chunk by chunk. */
export function ContentPreview({ workId, title, open, onClose }: { workId: string; title: string; open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const [next, setNext] = useState<number | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = async (after?: number) => {
    setLoading(true);
    setError(null);
    try {
      const page = await moderationService.reviewContent(workId, after);
      setText((t) => t + page.chunks.map((c) => c.content).join(""));
      setNext(page.nextAfter);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setText("");
    setNext(undefined);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workId]);

  return (
    <ResponsiveDrawer open={open} onClose={onClose} title={title}>
      <div className="prose prose--plain">
        {splitBlocks(text).map((b, i) => (
          <p key={i}>{b}</p>
        ))}
      </div>
      {loading && <Spinner label="Loading text" />}
      {error != null && <ErrorState error={error} onRetry={() => load(typeof next === "number" ? next : undefined)} />}
      {!loading && typeof next === "number" && (
        <Button variant="secondary" onClick={() => load(next)}>
          Load more
        </Button>
      )}
    </ResponsiveDrawer>
  );
}
