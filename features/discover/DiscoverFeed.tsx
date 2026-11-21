"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { worksService, type WorkSort } from "@/services/works.service";
import { categoriesService } from "@/services/categories.service";
import { useApi } from "@/hooks/useApi";
import { useCursorList } from "@/hooks/useCursorList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useInfiniteTrigger } from "@/hooks/useInfiniteTrigger";
import type { WorkDto } from "@/types/api";
import { WorkCard } from "@/components/work/WorkCard";
import { useAuth } from "@/stores/auth-store";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tabs, SegmentedControl } from "@/components/ui/Tabs";
import { InstallGuide } from "@/components/layout/InstallGuide";
import { EmptyState, ErrorState, Spinner, WorkCardSkeleton } from "@/components/ui/feedback";

const SORTS: { id: WorkSort; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "popular", label: "Most liked" },
  { id: "viewed", label: "Most read" },
  { id: "discussed", label: "Most discussed" },
];

const isSort = (v: string | null): v is WorkSort => SORTS.some((s) => s.id === v);

export function DiscoverFeed() {
  const router = useRouter();
  const pathname = usePathname();
  const { status: authStatus } = useAuth();
  const params = useSearchParams();
  // Wait for the session check so a signed in reader is never served the signed out (limited) feed.
  const authSettled = authStatus !== "loading";
  const signedIn = authStatus === "ready";
  const sort: WorkSort = isSort(params.get("sort")) ? (params.get("sort") as WorkSort) : "latest";
  const category = params.get("category") ?? undefined;
  const [q, setQ] = useState(params.get("q") ?? "");
  const debouncedQ = useDebouncedValue(q.trim(), 350);

  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`/discover${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [params, router],
  );

  // Keep the address bar in step with the search box once typing settles.
  useEffect(() => {
    if ((params.get("q") ?? "") !== debouncedQ) setParam("q", debouncedQ || undefined);
  }, [debouncedQ, params, setParam]);

  const cats = useApi((s) => categoriesService.list(s), []);
  const list = useCursorList<WorkDto>((cursor, signal) => worksService.discover({ cursor, sort, category, q: debouncedQ || undefined }, signal), [sort, category, debouncedQ, signedIn], authSettled);
  const sentinel = useInfiniteTrigger(list.loadMore, list.hasMore && !list.loadingMore && !list.loading);

  const loading = list.loading || !authSettled;
  const returnTo = encodeURIComponent(`${pathname}${params.size ? `?${params}` : ""}`);

  const categoryTabs = [{ id: "all", label: "All" }, ...(cats.data?.items.map((c) => ({ id: c.id, label: c.name })) ?? [])];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1>Discover</h1>
          <p>Stories, poems and essays from the community.</p>
        </div>
      </div>

      <InstallGuide />

      <div className="search">
        <Icon name="search" size={20} />
        <input className="input" type="search" placeholder="Search titles and authors" aria-label="Search works" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Tabs items={categoryTabs} value={category ?? "all"} onChange={(id) => setParam("category", id === "all" ? undefined : id)} label="Category" />
      <SegmentedControl items={SORTS} value={sort} onChange={(id) => setParam("sort", id === "latest" ? undefined : id)} label="Sort works" />

      <div className="feed" aria-busy={loading}>
        {loading && [0, 1, 2].map((i) => <WorkCardSkeleton key={i} />)}
        {list.items.map((w) => (
          <WorkCard key={w.id} work={w} />
        ))}
      </div>

      {list.error != null && <ErrorState error={list.error} onRetry={list.reload} />}
      {!loading && !list.error && list.items.length === 0 && (
        <EmptyState
          icon={debouncedQ ? "search" : "pen"}
          title={debouncedQ ? "No works match your search" : "Nothing published here yet"}
          action={
            debouncedQ ? undefined : authStatus === "ready" ? (
              <ButtonLink href="/write/new" icon="pen">Write something</ButtonLink>
            ) : (
              <ButtonLink href="/auth/register">Create an account</ButtonLink>
            )
          }
        >
          {debouncedQ ? "Try a different word or clear the category." : "Check back soon, or be the first to publish."}
        </EmptyState>
      )}
      {!loading && list.gated && (
        <div className="feed-gate">
          <p className="feed-gate__title">Log in or create your account to view more</p>
          <div className="feed-gate__actions">
            <ButtonLink href={`/auth/login?next=${returnTo}`} variant="secondary">
              Log in
            </ButtonLink>
            <ButtonLink href={`/auth/register?next=${returnTo}`}>Create account</ButtonLink>
          </div>
        </div>
      )}
      <div ref={sentinel} aria-hidden="true" />
      {list.loadingMore && (
        <div style={{ display: "grid", placeItems: "center" }}>
          <Spinner label="Loading more works" />
        </div>
      )}
    </div>
  );
}
