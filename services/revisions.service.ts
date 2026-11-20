import { api } from "@/lib/api/client";
import type { ContentPage, DraftStateDto, Page, RevisionDto, WorkDto } from "@/types/api";

export interface SaveRevisionInput {
  title: string;
  description: string;
  categoryId: string;
  content: string;
  changeReason?: string;
  makeCurrent?: boolean;
  basedOnRevisionId?: string;
  publish?: boolean;
}

export interface AutosaveInput {
  title: string;
  description: string;
  categoryId: string;
  content: string;
  basedOnRevisionId?: string;
}

const base = (workId: string) => `/works/${workId}`;

export const revisionsService = {
  list: (workId: string, cursor: string | null, signal?: AbortSignal) =>
    api.get<Page<RevisionDto>>(`${base(workId)}/revisions`, { auth: "required", query: { cursor, limit: 20 }, signal }),

  get: (workId: string, revisionId: string) => api.get<{ revision: RevisionDto }>(`${base(workId)}/revisions/${revisionId}`, { auth: "required" }),

  content: (workId: string, revisionId: string, after?: number, signal?: AbortSignal) =>
    api.get<ContentPage>(`${base(workId)}/revisions/${revisionId}/content`, { auth: "required", query: { after, limit: 3 }, signal }),

  save: (workId: string, input: SaveRevisionInput) =>
    api.post<{ revision: { revisionId: string; revisionNumber: number; madeCurrent: boolean }; work: WorkDto }>(`${base(workId)}/revisions`, input, { auth: "required" }),

  promote: (workId: string, revisionId: string) => api.post<{ work: WorkDto }>(`${base(workId)}/revisions/${revisionId}/promote`, undefined, { auth: "required" }),

  restore: (workId: string, revisionId: string) =>
    api.post<{ revision: { revisionId: string; revisionNumber: number }; work: WorkDto }>(`${base(workId)}/revisions/${revisionId}/restore`, undefined, { auth: "required" }),

  autosave: (workId: string, input: AutosaveInput) => api.put<{ version: number; totalBytes: number }>(`${base(workId)}/draft-state`, input, { auth: "required" }),
  draftState: (workId: string) => api.get<{ draftState: DraftStateDto | null }>(`${base(workId)}/draft-state`, { auth: "required" }),
  draftContent: (workId: string, after?: number) => api.get<ContentPage>(`${base(workId)}/draft-state/content`, { auth: "required", query: { after, limit: 3 } }),
};

/** Reads every chunk of a revision or draft, a few at a time. */
export async function loadAllChunks(
  fetchPage: (after?: number) => Promise<ContentPage>,
  onProgress?: (text: string) => void,
): Promise<string> {
  let text = "";
  let after: number | undefined;
  for (;;) {
    const page = await fetchPage(after);
    text += page.chunks.map((c) => c.content).join("");
    onProgress?.(text);
    if (page.nextAfter === null) return text;
    after = page.nextAfter;
  }
}
