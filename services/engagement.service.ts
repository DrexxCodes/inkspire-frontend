import { api } from "@/lib/api/client";
import type { CommentDto, Page, ShareTarget } from "@/types/api";

export const engagementService = {
  like: (workId: string) => api.put<{ liked: true; likeCount: number }>(`/works/${workId}/like`, undefined, { auth: "required" }),
  unlike: (workId: string) => api.delete<{ liked: false; likeCount: number }>(`/works/${workId}/like`, { auth: "required" }),
  share: (workId: string, platform: ShareTarget) => api.post<{ counted: boolean }>(`/works/${workId}/share`, { platform }, { auth: "optional" }),

  comments: (workId: string, p: { cursor: string | null; parent?: string }, signal?: AbortSignal) =>
    api.get<Page<CommentDto>>(`/works/${workId}/comments`, { auth: "optional", query: { cursor: p.cursor, parent: p.parent, limit: p.parent ? 20 : 10 }, signal }),

  addComment: (workId: string, content: string, parentCommentId?: string) =>
    api.post<{ comment: CommentDto }>(`/works/${workId}/comments`, { content, parentCommentId: parentCommentId ?? null }, { auth: "required" }),

  deleteComment: (workId: string, commentId: string) => api.delete<{ deleted: true }>(`/works/${workId}/comments/${commentId}`, { auth: "required" }),
};
