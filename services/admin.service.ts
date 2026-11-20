import { api } from "@/lib/api/client";
import type { AdminUser, AuditRow, ModerationRow, Page, Permissions, Role, WorkDto } from "@/types/api";

export interface UserDetail {
  user: AdminUser;
  categoryPermissions: { categoryId: string; canPost: boolean }[];
  moderationHistory: Pick<ModerationRow, "id" | "work_id" | "action" | "reason" | "moderator_id" | "created_at">[];
  adminActivity: Pick<AuditRow, "id" | "admin_id" | "action" | "target_type" | "metadata" | "created_at">[];
}

const authed = { auth: "required" as const };

export const adminService = {
  users: (p: { q?: string; role?: Role; status?: string; cursor: string | null }, signal?: AbortSignal) =>
    api.get<Page<AdminUser>>("/admin/users", { ...authed, query: { q: p.q, role: p.role, status: p.status, cursor: p.cursor, limit: 20 }, signal }),

  user: (uid: string) => api.get<UserDetail>(`/admin/users/${uid}`, authed),
  disable: (uid: string, reason?: string) => api.post<{ user: AdminUser }>(`/admin/users/${uid}/disable`, { reason }, authed),
  block: (uid: string, reason?: string) => api.post<{ user: AdminUser }>(`/admin/users/${uid}/block`, { reason }, authed),
  reactivate: (uid: string, reason?: string) => api.post<{ user: AdminUser }>(`/admin/users/${uid}/reactivate`, { reason }, authed),
  passwordReset: (uid: string) => api.post<{ sent: true }>(`/admin/users/${uid}/password-reset`, undefined, authed),
  setRole: (uid: string, role: Role) => api.put<{ user: AdminUser }>(`/admin/users/${uid}/role`, { role }, authed),
  setPermissions: (uid: string, permissions: Partial<Permissions>) => api.put<{ user: AdminUser }>(`/admin/users/${uid}/permissions`, { permissions }, authed),
  setCategoryPermission: (uid: string, categoryId: string, canPost: boolean) =>
    api.put<{ categoryId: string; canPost: boolean }>(`/admin/users/${uid}/category-permissions/${categoryId}`, { canPost }, authed),

  works: (p: { status?: string; moderation?: string; cursor: string | null }, signal?: AbortSignal) =>
    api.get<Page<WorkDto>>("/admin/works", { ...authed, query: { status: p.status, moderation: p.moderation, cursor: p.cursor, limit: 20 }, signal }),
  deleteWork: (id: string) => api.delete<{ deleted: true }>(`/admin/works/${id}`, authed),
  restoreWork: (id: string) => api.post<{ restored: true }>(`/admin/works/${id}/restore`, undefined, authed),
  permanentlyDeleteWork: (id: string) => api.post<{ deleted: true }>(`/admin/works/${id}/permanent-delete`, { confirm: true }, authed),

  auditLogs: (p: { action?: string; before?: string | null }, signal?: AbortSignal) =>
    api.get<Page<AuditRow>>("/admin/audit-logs", { ...authed, query: { action: p.action, before: p.before, limit: 30 }, signal }),
};
