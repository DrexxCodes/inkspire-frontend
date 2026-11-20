import { api } from "@/lib/api/client";
import type { Page, PrivateProfile, PublicProfile, WorkDto } from "@/types/api";

export const usersService = {
  profile: (username: string, signal?: AbortSignal) =>
    api.get<{ profile: PublicProfile }>(`/users/${encodeURIComponent(username)}`, { auth: "optional", signal }),

  works: (username: string, cursor: string | null, signal?: AbortSignal) =>
    api.get<Page<WorkDto>>(`/users/${encodeURIComponent(username)}/works`, { auth: "optional", query: { cursor, limit: 12 }, signal }),

  update: (input: { displayName?: string; bio?: string }) =>
    api.patch<{ profile: PrivateProfile }>("/users/me", input, { auth: "required" }),

  uploadPhoto: (kind: "profile" | "cover", file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.upload<{ url: string }>("/users/me/photo", form, { auth: "required", query: { kind } });
  },

  removePhoto: (kind: "profile" | "cover") => api.delete<{ url: string | null }>("/users/me/photo", { auth: "required", query: { kind } }),
};
