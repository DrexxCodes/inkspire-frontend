import { api } from "@/lib/api/client";
import type { ContentPage, Page, Visibility, WorkDto, WorkStatus } from "@/types/api";

export type WorkSort = "latest" | "popular" | "viewed" | "discussed";

export interface WorkInput {
  title: string;
  description: string;
  categoryId: string;
  content: string;
  visibility?: Visibility;
  publish?: boolean;
  idempotencyKey?: string;
}

export const worksService = {
  discover: (p: { cursor: string | null; sort?: WorkSort; category?: string; q?: string }, signal?: AbortSignal) =>
    api.get<Page<WorkDto>>("/works", { auth: "optional", query: { cursor: p.cursor, sort: p.sort, category: p.category, q: p.q, limit: 12 }, signal }),

  mine: (p: { cursor: string | null; status?: WorkStatus }, signal?: AbortSignal) =>
    api.get<Page<WorkDto>>("/works/mine", { auth: "required", query: { cursor: p.cursor, status: p.status, limit: 20 }, signal }),

  get: (id: string, signal?: AbortSignal) => api.get<{ work: WorkDto }>(`/works/${id}`, { auth: "optional", signal }),

  /** Content arrives a few chunks at a time. Pass the revisionId back so a mid read edit is detected. */
  content: (id: string, p: { after?: number; revisionId?: string }, signal?: AbortSignal) =>
    api.get<ContentPage & { revisionId: string }>(`/works/${id}/content`, { auth: "optional", query: { after: p.after, revisionId: p.revisionId, limit: 3 }, signal }),

  create: (input: WorkInput) => api.post<{ work: WorkDto }>("/works", input, { auth: "required" }),
  publish: (id: string) => api.post<{ work: WorkDto }>(`/works/${id}/publish`, undefined, { auth: "required" }),
  archive: (id: string) => api.post<{ work: WorkDto }>(`/works/${id}/archive`, undefined, { auth: "required" }),
  setVisibility: (id: string, visibility: Visibility) => api.patch<{ work: WorkDto }>(`/works/${id}/visibility`, { visibility }, { auth: "required" }),
  remove: (id: string) => api.delete<{ deleted: true }>(`/works/${id}`, { auth: "required" }),

  recordView: (id: string) => api.post<{ counted: boolean }>(`/works/${id}/view`, undefined, { auth: "optional" }),

  uploadCover: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.upload<{ url: string }>(`/works/${id}/cover`, form, { auth: "required" });
  },
};
