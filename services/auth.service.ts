import { api } from "@/lib/api/client";
import type { MeResponse, PrivateProfile } from "@/types/api";

export const authService = {
  usernameAvailable: (u: string, signal?: AbortSignal) =>
    api.get<{ available: boolean }>("/auth/username-available", { query: { u }, signal }),

  /** Creates the Firestore profile after the Firebase account exists. Safe to retry. */
  register: (input: { username: string; displayName?: string }) =>
    api.post<{ profile: PrivateProfile }>("/auth/register", input, { auth: "required" }),

  me: (signal?: AbortSignal) => api.get<MeResponse>("/auth/me", { auth: "required", signal }),
};
