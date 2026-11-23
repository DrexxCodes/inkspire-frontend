"use client";

import { promptsService } from "@/services/prompts.service";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/stores/auth-store";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { PromptCard } from "./PromptCard";

/** The weekly billboard: what is open now, what is coming, what is being judged and who won. */
export function Billboard() {
  const { status } = useAuth();
  const settled = status !== "loading";
  const data = useApi((s) => promptsService.billboard(s), [status === "ready"], settled);

  if (data.loading || !settled) {
    return (
      <div className="bb" aria-busy="true">
        <Skeleton height={180} radius={24} />
        <Skeleton height={180} radius={24} />
      </div>
    );
  }
  if (data.error != null) return <ErrorState error={data.error} onRetry={data.reload} />;
  const b = data.data!;
  const empty = !b.open.length && !b.upcoming.length && !b.judging.length && !b.completed.length;

  return (
    <div className="bb">
      {empty && <EmptyState icon="trophy" title="No prompts yet">Check back soon. A new writing prompt is posted every week.</EmptyState>}
      {b.open.length > 0 && (
        <section className="bb__section">
          <h2>This week&apos;s prompt</h2>
          <div className="bb__grid">{b.open.map((p) => <PromptCard key={p.id} prompt={p} />)}</div>
        </section>
      )}
      {b.judging.length > 0 && (
        <section className="bb__section">
          <h2>Being judged</h2>
          <div className="bb__grid bb__grid--2">{b.judging.map((p) => <PromptCard key={p.id} prompt={p} />)}</div>
        </section>
      )}
      {b.completed.length > 0 && (
        <section className="bb__section">
          <h2>Winners</h2>
          <div className="bb__grid">{b.completed.map((p) => <PromptCard key={p.id} prompt={p} showWinners />)}</div>
        </section>
      )}
      {b.upcoming.length > 0 && (
        <section className="bb__section">
          <h2>Coming up</h2>
          <div className="bb__grid bb__grid--2">{b.upcoming.map((p) => <PromptCard key={p.id} prompt={p} />)}</div>
        </section>
      )}
    </div>
  );
}
