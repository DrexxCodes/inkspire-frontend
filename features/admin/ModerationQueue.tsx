"use client";

import { useState } from "react";
import { moderationService } from "@/services/moderation.service";
import { useCursorList } from "@/hooks/useCursorList";
import { useToast } from "@/stores/toast-store";
import { formatDateTime } from "@/utils/format";
import type { ReviewQueueItem } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, LoadMore, Spinner } from "@/components/ui/feedback";
import { ContentPreview } from "./ContentPreview";

type Action = { kind: "approve" | "reject"; item: ReviewQueueItem } | null;

export function ModerationQueue() {
  const toast = useToast();
  const list = useCursorList<ReviewQueueItem>((cursor, signal) => moderationService.queue(cursor, signal), []);
  const [action, setAction] = useState<Action>(null);
  const [preview, setPreview] = useState<ReviewQueueItem | null>(null);

  const done = (item: ReviewQueueItem, message: string) => {
    list.mutate((items) => items.filter((i) => i.reviewId !== item.reviewId));
    toast.success(message);
  };

  if (list.loading) return <Spinner label="Loading the review queue" />;
  if (list.error != null) return <ErrorState error={list.error} onRetry={list.reload} />;
  if (list.items.length === 0) return <EmptyState icon="check" title="The queue is clear">Works that authors send for review will appear here.</EmptyState>;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {list.items.map((item) => (
        <article key={item.reviewId} className="queue-card">
          <div>
            <h2 className="h3">{item.work.title}</h2>
            <p className="small muted">
              by {item.work.author.displayName} (@{item.work.author.username}), requested {formatDateTime(item.requestedAt)}
            </p>
          </div>
          {item.work.moderation?.reason && (
            <div>
              <div className="small muted" style={{ marginBottom: 4 }}>Original flag reason</div>
              <div className="queue-card__reason">{item.work.moderation.reason}</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="secondary" size="sm" icon="eye" onClick={() => setPreview(item)}>
              Read revision
            </Button>
            <span className="spacer" />
            <Button variant="danger" size="sm" onClick={() => setAction({ kind: "reject", item })}>
              Reject
            </Button>
            <Button size="sm" onClick={() => setAction({ kind: "approve", item })}>
              Approve
            </Button>
          </div>
        </article>
      ))}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />

      <ConfirmDialog
        open={action?.kind === "approve"}
        onClose={() => setAction(null)}
        title="Approve this work?"
        confirmLabel="Approve and republish"
        reasonLabel="Note for the author (optional)"
        reasonRequired={false}
        onConfirm={async (note) => {
          if (!action) return;
          await moderationService.approve(action.item.work.id, note.trim() || undefined);
          done(action.item, "Approved");
        }}
      >
        The work becomes visible to readers again.
      </ConfirmDialog>

      <ConfirmDialog
        open={action?.kind === "reject"}
        onClose={() => setAction(null)}
        title="Reject this review?"
        confirmLabel="Reject"
        tone="danger"
        reasonLabel="Reason shown to the author"
        reasonRequired
        onConfirm={async (reason) => {
          if (!action) return;
          await moderationService.reject(action.item.work.id, reason.trim());
          done(action.item, "Rejected");
        }}
      >
        The author can revise the work and ask for another review.
      </ConfirmDialog>

      {preview && <ContentPreview workId={preview.work.id} title={preview.work.title} open onClose={() => setPreview(null)} />}
    </div>
  );
}
