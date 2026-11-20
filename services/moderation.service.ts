import { api } from "@/lib/api/client";
import type { ContentPage, ModerationRow, Page, ReviewQueueItem } from "@/types/api";

export const moderationService = {
  requestReview: (workId: string, revisionId: string) =>
    api.post<{ reviewId: string; created: boolean }>(`/moderation/works/${workId}/request-review`, { revisionId }, { auth: "required" }),

  queue: async (cursor: string | null, signal?: AbortSignal): Promise<Page<ReviewQueueItem>> => {
    const page = await api.get<Page<Omit<ReviewQueueItem, "id">>>("/moderation/queue", { auth: "required", query: { cursor, limit: 20 }, signal });
    return { ...page, items: page.items.map((i) => ({ ...i, id: i.reviewId })) };
  },

  flag: (workId: string, reason: string) => api.post<{ changed: boolean }>(`/moderation/works/${workId}/flag`, { reason }, { auth: "required" }),
  unflag: (workId: string, reason?: string) => api.post<{ unflagged: true }>(`/moderation/works/${workId}/unflag`, { reason }, { auth: "required" }),
  approve: (workId: string, note?: string) => api.post<{ approved: true }>(`/moderation/works/${workId}/approve`, { note }, { auth: "required" }),
  reject: (workId: string, reason: string) => api.post<{ rejected: true }>(`/moderation/works/${workId}/reject`, { reason }, { auth: "required" }),

  reviewContent: (workId: string, after?: number) =>
    api.get<ContentPage & { revision: { id: string; revisionNumber: number; title: string } }>(`/moderation/works/${workId}/review-content`, { auth: "required", query: { after, limit: 3 } }),

  history: (p: { workId?: string; userId?: string; before?: string | null }) =>
    api.get<Page<ModerationRow>>("/moderation/history", { auth: "required", query: { workId: p.workId, userId: p.userId, before: p.before, limit: 30 } }),
};
