import { api } from "@/lib/api/client";
import type { NotificationDto, Page } from "@/types/api";

export const notificationsService = {
  list: (cursor: string | null, signal?: AbortSignal) => api.get<Page<NotificationDto>>("/notifications", { auth: "required", query: { cursor, limit: 20 }, signal }),
  unreadCount: (signal?: AbortSignal) => api.get<{ count: number }>("/notifications/unread-count", { auth: "required", signal }),
  readAll: () => api.post<{ updated: number }>("/notifications/read-all", undefined, { auth: "required" }),
  read: (id: string) => api.post<{ read: true }>(`/notifications/${id}/read`, undefined, { auth: "required" }),
};
