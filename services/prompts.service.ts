import { api } from "@/lib/api/client";
import type { Billboard, Page, PromptDto, PromptPhase, WorkDto } from "@/types/api";
import type { WorkSort } from "./works.service";

export interface PromptInput {
  title: string;
  description: string;
  categoryId: string;
  /** ISO 8601 with offset. */
  startsAt: string;
  endsAt: string;
  maxEntriesPerUser: number;
}

export interface WinnerPick {
  workId: string;
  placement: number;
  note?: string;
}

const authed = { auth: "required" as const };

export const promptsService = {
  billboard: (signal?: AbortSignal) => api.get<Billboard>("/prompts/billboard", { auth: "optional", signal }),
  list: (p: { cursor: string | null; phase?: PromptPhase }, signal?: AbortSignal) =>
    api.get<Page<PromptDto>>("/prompts", { auth: "optional", query: { cursor: p.cursor, phase: p.phase, limit: 12 }, signal }),
  get: (id: string, signal?: AbortSignal) => api.get<{ prompt: PromptDto }>(`/prompts/${id}`, { auth: "optional", signal }),
  entries: (id: string, p: { cursor: string | null; sort?: WorkSort }, signal?: AbortSignal) =>
    api.get<Page<WorkDto>>(`/prompts/${id}/entries`, { auth: "optional", query: { cursor: p.cursor, sort: p.sort, limit: 12 }, signal }),
};

export const adminPromptsService = {
  list: (p: { cursor: string | null; phase?: PromptPhase }, signal?: AbortSignal) =>
    api.get<Page<PromptDto>>("/admin/prompts", { ...authed, query: { cursor: p.cursor, phase: p.phase, limit: 20 }, signal }),
  get: (id: string, signal?: AbortSignal) => api.get<{ prompt: PromptDto }>(`/admin/prompts/${id}`, { ...authed, signal }),
  entries: (id: string, p: { cursor: string | null; sort?: WorkSort }, signal?: AbortSignal) =>
    api.get<Page<WorkDto>>(`/admin/prompts/${id}/entries`, { ...authed, query: { cursor: p.cursor, sort: p.sort, limit: 20 }, signal }),
  create: (input: PromptInput) => api.post<{ prompt: PromptDto }>("/admin/prompts", input, authed),
  update: (id: string, patch: Partial<PromptInput>) => api.patch<{ prompt: PromptDto }>(`/admin/prompts/${id}`, patch, authed),
  publish: (id: string) => api.post<{ prompt: PromptDto }>(`/admin/prompts/${id}/publish`, undefined, authed),
  unpublish: (id: string) => api.post<{ prompt: PromptDto }>(`/admin/prompts/${id}/unpublish`, undefined, authed),
  remove: (id: string) => api.delete<{ deleted: true }>(`/admin/prompts/${id}`, authed),
  setWinners: (id: string, winners: WinnerPick[]) => api.put<{ prompt: PromptDto }>(`/admin/prompts/${id}/winners`, { winners }, authed),
};
