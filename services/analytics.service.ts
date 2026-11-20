import { api } from "@/lib/api/client";
import type { Granularity, SeriesRow, Summary, WorkDto } from "@/types/api";

const authed = { auth: "required" as const };

export const analyticsService = {
  summary: (signal?: AbortSignal) => api.get<Summary>("/analytics/summary", { ...authed, signal }),
  timeseries: (granularity: Granularity, signal?: AbortSignal) =>
    api.get<{ granularity: Granularity; series: SeriesRow[] }>("/analytics/timeseries", { ...authed, query: { granularity }, signal }),
  categories: (signal?: AbortSignal) => api.get<{ items: { id: string; name: string; publishedCount: number }[] }>("/analytics/categories", { ...authed, signal }),
  topWorks: (by: "views" | "likes" | "comments", signal?: AbortSignal) => api.get<{ items: WorkDto[] }>("/analytics/top-works", { ...authed, query: { by, limit: 8 }, signal }),
  topAuthors: (signal?: AbortSignal) =>
    api.get<{ items: { username: string; displayName: string; profilePhotoUrl: string | null; publishedWorks: number; likesReceived: number }[] }>("/analytics/top-authors", { ...authed, query: { limit: 8 }, signal }),
};
