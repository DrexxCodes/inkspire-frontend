import { api } from "@/lib/api/client";
import type { CategoryDto, PostableCategory } from "@/types/api";

export const categoriesService = {
  list: (signal?: AbortSignal) => api.get<{ items: CategoryDto[] }>("/categories", { auth: "optional", signal }),
  listAll: (signal?: AbortSignal) => api.get<{ items: CategoryDto[] }>("/categories", { auth: "required", query: { all: true }, signal }),
  postable: (signal?: AbortSignal) => api.get<{ items: PostableCategory[] }>("/categories/postable", { auth: "required", signal }),
  create: (input: { name: string; description: string; isActive: boolean }) =>
    api.post<{ category: CategoryDto }>("/categories", input, { auth: "required" }),
  update: (id: string, patch: Partial<Pick<CategoryDto, "name" | "description" | "isActive">>) =>
    api.patch<{ category: CategoryDto }>(`/categories/${id}`, patch, { auth: "required" }),
  remove: (id: string) => api.delete<{ deleted: true }>(`/categories/${id}`, { auth: "required" }),
};
