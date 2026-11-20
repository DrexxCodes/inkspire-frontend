"use client";

import { useState } from "react";
import { revisionsService } from "@/services/revisions.service";
import { errorMessage } from "@/lib/api/errors";
import { useCursorList } from "@/hooks/useCursorList";
import { useToast } from "@/stores/toast-store";
import { formatDateTime } from "@/utils/format";
import type { RevisionDto, WorkDto } from "@/types/api";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, LoadMore, Spinner } from "@/components/ui/feedback";
import { ResponsiveDrawer } from "@/components/ui/Overlay";
import { SegmentedControl } from "@/components/ui/Tabs";
import { RevisionDiff } from "@/components/work/RevisionDiff";
import { loadAllChunks } from "@/services/revisions.service";

interface Props {
  work: WorkDto;
  /** Called after promote or restore so the page can refresh the work. */
  onWorkChanged: (work: WorkDto) => void;
}

type Pending = { kind: "promote" | "restore"; rev: RevisionDto } | null;

function describeOrigin(r: RevisionDto, byNumber: Map<string, number>): string | null {
  if (r.restoredFromRevisionId) {
    const n = byNumber.get(r.restoredFromRevisionId);
    return n ? `Restored from version ${n}` : "Restored from an earlier version";
  }
  return r.changeReason;
}

export function RevisionTimeline({ work, onWorkChanged }: Props) {
  const toast = useToast();
  const list = useCursorList<RevisionDto>((cursor, signal) => revisionsService.list(work.id, cursor, signal), [work.id, work.currentRevisionId]);
  const [pending, setPending] = useState<Pending>(null);
  const [view, setView] = useState<RevisionDto | null>(null);
  const [viewText, setViewText] = useState<string | null>(null);
  const [compare, setCompare] = useState<{ rev: RevisionDto; against: "current" | "previous"; a: string; b: string; bLabel: string } | null>(null);
  const [mode, setMode] = useState<"current" | "previous">("current");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [otherLabel, setOtherLabel] = useState("");

  const numbers = new Map(list.items.map((r) => [r.id, r.revisionNumber]));
  const current = list.items.find((r) => r.isCurrent);

  const readText = (id: string) => loadAllChunks((after) => revisionsService.content(work.id, id, after));

  const openView = async (r: RevisionDto) => {
    setView(r);
    setViewText(null);
    try {
      setViewText(await readText(r.id));
    } catch (e) {
      toast.error(errorMessage(e));
      setView(null);
    }
  };

  const openCompare = async (r: RevisionDto, against: "current" | "previous") => {
    const idx = list.items.findIndex((x) => x.id === r.id);
    const other = against === "current" ? current : list.items[idx + 1];
    if (!other) {
      toast.info(against === "current" ? "There is no current version to compare with." : "This is the first version.");
      return;
    }
    setBusyId(r.id);
    try {
      const [a, b] = await Promise.all([readText(other.id), readText(r.id)]);
      setOtherLabel(`Version ${other.revisionNumber}`);
      setCompare({ rev: r, against, a, b, bLabel: `Version ${r.revisionNumber}` });
      setMode(against);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const confirm = async () => {
    if (!pending) return;
    const res = pending.kind === "promote" ? await revisionsService.promote(work.id, pending.rev.id) : await revisionsService.restore(work.id, pending.rev.id);
    onWorkChanged(res.work);
    toast.success(pending.kind === "promote" ? `Version ${pending.rev.revisionNumber} is now current` : "Restored as a new version");
    list.reload();
  };

  if (list.loading) return <Spinner label="Loading history" />;
  if (list.error != null) return <ErrorState error={list.error} onRetry={list.reload} title="Could not load history" />;
  if (list.items.length === 0) return <EmptyState icon="history" title="No saved versions yet">Save your work to create the first version.</EmptyState>;

  return (
    <>
      <ol className="timeline" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {list.items.map((r) => {
          const origin = describeOrigin(r, numbers);
          return (
            <li key={r.id} className="timeline__item" data-current={r.isCurrent}>
              <span className="timeline__dot" aria-hidden="true" />
              <div className="timeline__head">
                <span className="timeline__version">Version {r.revisionNumber}</span>
                {r.isCurrent && <span className="chip chip--static">Current</span>}
                <span className="timeline__date">{formatDateTime(r.createdAt)}</span>
              </div>
              {origin && <p className="timeline__note">{origin}</p>}
              <div className="timeline__actions">
                <Button size="sm" variant="secondary" onClick={() => openView(r)}>
                  View
                </Button>
                {!r.isCurrent && (
                  <Button size="sm" variant="secondary" loading={busyId === r.id} onClick={() => openCompare(r, "current")}>
                    Compare with current
                  </Button>
                )}
                <Button size="sm" variant="ghost" loading={busyId === r.id} onClick={() => openCompare(r, "previous")}>
                  What changed
                </Button>
                <ButtonLink size="sm" variant="ghost" href={`/write/${work.id}?revision=${r.id}`}>
                  Edit from here
                </ButtonLink>
                {!r.isCurrent && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setPending({ kind: "promote", rev: r })}>
                      Make current
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPending({ kind: "restore", rev: r })}>
                      Restore
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending?.kind === "promote" ? `Make version ${pending.rev.revisionNumber} current?` : `Restore version ${pending?.rev.revisionNumber}?`}
        confirmLabel={pending?.kind === "promote" ? "Make current" : "Restore"}
        onConfirm={confirm}
      >
        {pending?.kind === "promote"
          ? "Readers will see this version right away. Nothing is deleted, and you can switch back any time."
          : "This copies the old text into a brand new version and makes it current. Your history stays untouched."}
      </ConfirmDialog>

      <ResponsiveDrawer open={!!view} onClose={() => setView(null)} title={view ? `Version ${view.revisionNumber}` : ""}>
        {viewText === null ? <Spinner label="Loading version" /> : <div className="prose prose--plain">{viewText.split(/\n{2,}/).map((b, i) => <p key={i}>{b}</p>)}</div>}
      </ResponsiveDrawer>

      <ResponsiveDrawer open={!!compare} onClose={() => setCompare(null)} title="Compare versions">
        {compare && (
          <>
            <SegmentedControl
              label="Compare against"
              items={[
                { id: "current", label: "Current" },
                { id: "previous", label: "Previous" },
              ]}
              value={mode}
              onChange={(m) => openCompare(compare.rev, m)}
            />
            <div style={{ marginTop: 16 }}>
              <RevisionDiff before={compare.a} after={compare.b} beforeLabel={otherLabel} afterLabel={compare.bLabel} />
            </div>
          </>
        )}
      </ResponsiveDrawer>
    </>
  );
}
