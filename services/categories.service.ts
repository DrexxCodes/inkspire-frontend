import { api } from "@/lib/api/client";
import type { CategoryDto, PostableCategory } from "@/types/api";

export const categoriesService = {
  list: (signal?: AbortSignal) => api.get<{ items: CategoryDto[] }>("/categories", { auth: "optional", signal }),
  listAll: (signal?: AbortSignal) => api.get<{ items: CategoryDto[] }>("/categories", { auth: "required", query: { all: true }, signal }),
  postable: (signal?: AbortSignal) => api.get<{ items: PostableCategory[] }>("/categories/postable", { auth: "required", signal }),
  /**
   * Categories for the editor dropdown. If the permission check cannot load, fall back to the public list so the
   * writer can still choose where to write. The backend re-checks permission on every save and publish.
   */
  forEditor: async (signal?: AbortSignal): Promise<{ items: PostableCategory[] }> => {
    try {
      return await categoriesService.postable(signal);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") throw e;
      const all = await categoriesService.list(signal);
      return { items: all.items.map((c) => ({ ...c, canPost: true })) };
    }
  },
  create: (input: { name: string; description: string; isActive: boolean }) =>
    api.post<{ category: CategoryDto }>("/categories", input, { auth: "required" }),
  update: (id: string, patch: Partial<Pick<CategoryDto, "name" | "description" | "isActive">>) =>
    api.patch<{ category: CategoryDto }>(`/categories/${id}`, patch, { auth: "required" }),
  remove: (id: string) => api.delete<{ deleted: true }>(`/categories/${id}`, { auth: "required" }),
};
