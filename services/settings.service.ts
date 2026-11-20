import { api } from "@/lib/api/client";
import type { PlatformSettings, PublicSettings } from "@/types/api";

export const settingsService = {
  public: (signal?: AbortSignal) => api.get<{ settings: PublicSettings }>("/settings/public", { signal }),
  get: (signal?: AbortSignal) => api.get<{ settings: PlatformSettings }>("/settings", { auth: "required", signal }),
  update: (patch: Partial<PlatformSettings>) => api.put<{ settings: PlatformSettings }>("/settings", patch, { auth: "required" }),
};
