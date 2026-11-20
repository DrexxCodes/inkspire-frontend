"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DiscoverFeed } from "@/features/discover/DiscoverFeed";
import { DiscoverRail } from "@/features/discover/DiscoverRail";

function Page() {
  const router = useRouter();
  const params = useSearchParams();
  const select = (id: string | undefined) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("category", id);
    else next.delete("category");
    router.replace(`/discover${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  return (
    <AppShell rail={<DiscoverRail active={params.get("category") ?? undefined} onSelect={select} />}>
      <DiscoverFeed />
    </AppShell>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
