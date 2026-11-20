"use client";

import Link from "next/link";
import { use, useState } from "react";
import { worksService } from "@/services/works.service";
import { useApi } from "@/hooks/useApi";
import { AppShell } from "@/components/layout/AppShell";
import { RouteGate } from "@/components/layout/RouteGate";
import { ErrorState, Spinner } from "@/components/ui/feedback";
import { RevisionTimeline } from "@/features/revisions/RevisionTimeline";
import type { WorkDto } from "@/types/api";

function History({ id }: { id: string }) {
  const meta = useApi((s) => worksService.get(id, s), [id]);
  const [override, setOverride] = useState<WorkDto | null>(null);
  const work = override ?? meta.data?.work;
  if (meta.loading) return <Spinner label="Loading history" />;
  if (meta.error || !work) return <ErrorState error={meta.error ?? new Error("Work not found.")} onRetry={meta.reload} />;
  if (!work.viewer.isAuthor) return <ErrorState error={new Error("Only the author can see the version history.")} />;
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="page-head">
        <div>
          <h1>Version history</h1>
          <p>{work.title}</p>
        </div>
        <span className="spacer" />
        <Link href={`/write/${work.id}`} className="btn btn--secondary">
          Back to editor
        </Link>
      </div>
      <RevisionTimeline work={work} onWorkChanged={setOverride} />
    </div>
  );
}

export default function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell>
      <RouteGate>
        <History id={id} />
      </RouteGate>
    </AppShell>
  );
}
