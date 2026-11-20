/** Appends a page to a list without ever showing the same item twice (cursor pages can overlap). */
export function mergePage<T extends { id: string }>(prev: T[], next: T[]): T[] {
  const seen = new Set(prev.map((i) => i.id));
  const out = prev.slice();
  for (const item of next) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export const removeById = <T extends { id: string }>(list: T[], id: string): T[] => list.filter((i) => i.id !== id);

export const updateById = <T extends { id: string }>(list: T[], id: string, patch: Partial<T> | ((item: T) => T)): T[] =>
  list.map((i) => (i.id === id ? (typeof patch === "function" ? patch(i) : { ...i, ...patch }) : i));
