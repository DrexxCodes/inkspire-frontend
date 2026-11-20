"use client";

import { useEffect, useState } from "react";
import { worksService } from "@/services/works.service";
import { loadAllChunks, revisionsService } from "@/services/revisions.service";
import type { DraftStateDto, RevisionDto, WorkDto } from "@/types/api";
import type { EditorFields } from "./editor.logic";

export interface LoadedEditor {
  work: WorkDto;
  /** The revision whose text opened in the editor. */
  revision: RevisionDto;
  fields: EditorFields;
  /** Unsaved changes from a previous session, if any. */
  recovered: { fields: EditorFields; updatedAt: string } | null;
}

export type EditorLoad = { status: "loading" } | { status: "error"; error: unknown } | { status: "ready"; data: LoadedEditor };

/** Opens an existing work for editing, optionally from an older revision. */
export function useEditorLoad(workId: string | undefined, revisionId: string | null, tick = 0): EditorLoad {
  const [state, setState] = useState<EditorLoad>({ status: "loading" });

  useEffect(() => {
    if (!workId) return;
    let alive = true;
    setState({ status: "loading" });
    (async () => {
      const { work } = await worksService.get(workId);
      const targetId = revisionId ?? work.currentRevisionId;
      if (!targetId) throw new Error("This work has no saved version yet.");
      const [{ revision }, text, draft] = await Promise.all([
        revisionsService.get(workId, targetId),
        loadAllChunks((after) => revisionsService.content(workId, targetId, after)),
        revisionsService.draftState(workId).catch(() => ({ draftState: null as DraftStateDto | null })),
      ]);
      const fields: EditorFields = { title: revision.title, description: revision.description, categoryId: revision.categoryId, content: text };
      let recovered: LoadedEditor["recovered"] = null;
      const d = draft.draftState;
      if (d && d.basedOnRevisionId === targetId && new Date(d.updatedAt) > new Date(revision.createdAt)) {
        const draftText = await loadAllChunks((after) => revisionsService.draftContent(workId, after));
        const df: EditorFields = { title: d.title, description: d.description, categoryId: d.categoryId, content: draftText };
        if (df.title !== fields.title || df.description !== fields.description || df.categoryId !== fields.categoryId || df.content !== fields.content) recovered = { fields: df, updatedAt: d.updatedAt };
      }
      if (alive) setState({ status: "ready", data: { work, revision, fields, recovered } });
    })().catch((error) => alive && setState({ status: "error", error }));
    return () => {
      alive = false;
    };
  }, [workId, revisionId, tick]);

  return state;
}
