"use client";

import Link from "next/link";
import { useState } from "react";
import { worksService } from "@/services/works.service";
import { errorMessage } from "@/lib/api/errors";
import { useCursorList } from "@/hooks/useCursorList";
import { useToast } from "@/stores/toast-store";
import type { WorkDto, WorkStatus } from "@/types/api";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, LoadMore, Spinner } from "@/components/ui/feedback";
import { Tabs } from "@/components/ui/Tabs";
import { WorkCard } from "@/components/work/WorkCard";

type Filter = "all" | WorkStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Drafts" },
  { id: "flagged", label: "Flagged" },
  { id: "archived", label: "Unpublished" },
];

export function Studio() {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [removing, setRemoving] = useState<WorkDto | null>(null);
  const list = useCursorList<WorkDto>((cursor, signal) => worksService.mine({ cursor, status: filter === "all" ? undefined : filter }, signal), [filter]);

  const replace = (w: WorkDto) => list.mutate((items) => items.map((i) => (i.id === w.id ? w : i)));

  const act = async (fn: () => Promise<{ work: WorkDto }>, done: string) => {
    try {
      replace((await fn()).work);
      toast.success(done);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1>My works</h1>
          <p>Drafts, published pieces and anything that needs your attention.</p>
        </div>
        <span className="spacer" />
        {/* On phones and tablets the round "+" in the tab bar does this, so the button is desktop only. */}
        <ButtonLink href="/write/new" icon="plus" className="show-lg">
          New work
        </ButtonLink>
      </div>
      <Tabs items={FILTERS} value={filter} onChange={setFilter} label="Filter works" />

      {list.loading && <Spinner label="Loading your works" />}
      {list.error != null && <ErrorState error={list.error} onRetry={list.reload} />}
      {!list.loading && !list.error && list.items.length === 0 && (
        <EmptyState icon="pen" title="Nothing here yet" action={<ButtonLink href="/write/new">Start writing</ButtonLink>}>
          Your works will show up here as you write them.
        </EmptyState>
      )}

      <div className="feed">
        {list.items.map((w) => (
          <div key={w.id} style={{ display: "grid", gap: 8 }}>
            <WorkCard work={w} showStatus href={w.status === "published" ? `/works/${w.id}` : `/write/${w.id}`} />
            <div className="work-actions">
              <ButtonLink href={`/write/${w.id}`} size="sm" variant="secondary" icon="pen">
                Edit
              </ButtonLink>
              <Link href={`/write/${w.id}/history`} className="btn btn--ghost btn--sm">
                History
              </Link>
              {w.status === "published" && (
                <Button size="sm" variant="ghost" onClick={() => act(() => worksService.archive(w.id), "Unpublished")}>
                  Unpublish
                </Button>
              )}
              {(w.status === "draft" || w.status === "archived") && (
                <Button size="sm" variant="ghost" onClick={() => act(() => worksService.publish(w.id), "Published")}>
                  Publish
                </Button>
              )}
              <Button size="sm" variant="ghost" className="danger-text" onClick={() => setRemoving(w)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Delete "${removing?.title ?? ""}"?`}
        confirmLabel="Delete work"
        tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          await worksService.remove(removing.id);
          list.mutate((items) => items.filter((i) => i.id !== removing.id));
          toast.success("Work deleted");
        }}
      >
        It will disappear for readers. A moderator can still restore it if this was a mistake.
      </ConfirmDialog>
    </div>
  );
}
