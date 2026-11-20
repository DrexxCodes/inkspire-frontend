"use client";

import { useMemo } from "react";
import { cn } from "@/utils/cn";
import { diffStats, diffText, toSideBySide } from "@/utils/diff";

interface Props {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
}

/** Side by side comparison. On narrow screens each pair stacks, with the older text on top. */
export function RevisionDiff({ before, after, beforeLabel, afterLabel }: Props) {
  const { rows, stats } = useMemo(() => {
    const ops = diffText(before, after);
    return { rows: toSideBySide(ops), stats: diffStats(ops) };
  }, [before, after]);

  if (before === after) return <p className="muted">These two versions have identical text.</p>;

  return (
    <div>
      <p className="small muted" style={{ marginBottom: 8 }} aria-live="polite">
        {stats.added} {stats.added === 1 ? "line" : "lines"} added, {stats.removed} removed
      </p>
      <div className="diff" role="table" aria-label="Changes between versions">
        <div className="diff__head" role="row">
          <div role="columnheader">{beforeLabel}</div>
          <div role="columnheader">{afterLabel}</div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="diff__row" role="row">
            <div role="cell" className={cn("diff__cell", r.left === null && "diff__cell--empty", (r.kind === "removed" || r.kind === "changed") && "diff__cell--removed")}>
              {r.left}
            </div>
            <div role="cell" className={cn("diff__cell", r.right === null && "diff__cell--empty", (r.kind === "added" || r.kind === "changed") && "diff__cell--added")}>
              {r.right}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
