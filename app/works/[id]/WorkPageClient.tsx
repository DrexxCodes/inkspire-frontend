"use client";

import { AppShell } from "@/components/layout/AppShell";
import { WorkReader } from "@/features/reader/WorkReader";

export function WorkPageClient({ id }: { id: string }) {
  return (
    <AppShell>
      <WorkReader workId={id} />
    </AppShell>
  );
}
