"use client";

import { useState } from "react";
import { promptsService } from "@/services/prompts.service";
import type { WorkSort } from "@/services/works.service";
import { useApi } from "@/hooks/useApi";
import { useCursorList } from "@/hooks/useCursorList";
import { useAuth } from "@/stores/auth-store";
import type { WorkDto } from "@/types/api";
import { WorkCard } from "@/components/work/WorkCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadMore, Skeleton, WorkCardSkeleton } from "@/components/ui/feedback";
import { SegmentedControl } from "@/components/ui/Tabs";
import { PromptCard } from "./PromptCard";
import { WinnerList } from "./WinnerList";

const SORTS: { id: WorkSort; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "popular", label: "Most liked" },
  { id: "viewed", label: "Most read" },
];

/** One prompt: its brief, the winners with their profiles, and every entry written for it. */
export function PromptDetail({ id }: { id: string }) {
  const { status } = useAuth();
  const settled = status !== "loading";
  const [sort, setSort] = useState<WorkSort>("latest");
  const prompt = useApi((s) => promptsService.get(id, s), [id, status === "ready"], settled);
  const list = useCursorList<WorkDto>((cursor, signal) => promptsService.entries(id, { cursor, sort }, signal), [id, sort, status === "ready"], settled);

  if (prompt.loading || !settled) return <Skeleton height={220} radius={24} />;
  if (prompt.error != null || !prompt.data) return <ErrorState error={prompt.error ?? new Error("Not found")} onRetry={prompt.reload} title="We could not open this prompt" />;
  const p = prompt.data.prompt;

  return (
    <div className="bb">
      <PromptCard prompt={{ ...p, winners: [] }} />
      {p.winners.length > 0 && (
        <section className="bb__section">
          <h2>Winners</h2>
          <WinnerList winners={p.winners} />
        </section>
      )}
      <section className="bb__section">
        <h2>All entries ({p.entryCount})</h2>
        <SegmentedControl items={SORTS} value={sort} onChange={setSort} label="Sort entries" />
        <div className="feed" aria-busy={list.loading}>
          {list.loading && [0, 1].map((i) => <WorkCardSkeleton key={i} />)}
          {list.items.map((w) => <WorkCard key={w.id} work={w} />)}
        </div>
        {list.error != null && <ErrorState error={list.error} onRetry={list.reload} />}
        {!list.loading && !list.error && list.items.length === 0 && (
          <EmptyState
            icon="pen"
            title="No entries yet"
            action={p.phase === "open" ? <ButtonLink href={`/write/new?prompt=${p.id}`} icon="pen">Be the first to write</ButtonLink> : undefined}
          >
            {p.phase === "open" ? "Entries appear here once they are published." : "Nobody entered this prompt."}
          </EmptyState>
        )}
        <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
      </section>
    </div>
  );
}
