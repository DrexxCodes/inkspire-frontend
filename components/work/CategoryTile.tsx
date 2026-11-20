import { cn } from "@/utils/cn";
import { tintFor } from "@/utils/colors";
import { formatCount } from "@/utils/format";
import type { CategoryDto } from "@/types/api";

interface Props {
  category: CategoryDto;
  active?: boolean;
  onSelect: (id: string) => void;
}

/** Square (or round) category button used in the discovery rail. */
export function CategoryTile({ category, active, onSelect }: Props) {
  return (
    <button type="button" className={cn("cat-tile", `tint-${tintFor(category.id)}`)} aria-pressed={!!active} onClick={() => onSelect(category.id)} style={active ? { outline: "3px solid var(--ink)", outlineOffset: 2 } : undefined}>
      <span>{category.name}</span>
      {typeof category.publishedCount === "number" && <small>{formatCount(category.publishedCount)} works</small>}
    </button>
  );
}
