"use client";

import { categoriesService } from "@/services/categories.service";
import { useApi } from "@/hooks/useApi";
import { CategoryTile } from "@/components/work/CategoryTile";
import { Skeleton } from "@/components/ui/feedback";

export function DiscoverRail({ active, onSelect }: { active: string | undefined; onSelect: (id: string | undefined) => void }) {
  const cats = useApi((s) => categoriesService.list(s), []);
  return (
    <section aria-labelledby="rail-cats">
      <h2 id="rail-cats" className="rail__title">
        Browse by category
      </h2>
      <div className="cat-grid">
        {cats.loading && [0, 1, 2, 3].map((i) => <Skeleton key={i} height={96} radius={24} />)}
        {cats.data?.items.map((c) => (
          <CategoryTile key={c.id} category={c} active={active === c.id} onSelect={(id) => onSelect(active === id ? undefined : id)} />
        ))}
      </div>
    </section>
  );
}
