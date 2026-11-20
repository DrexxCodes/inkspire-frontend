"use client";

import { use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WorkReader } from "@/features/reader/WorkReader";

export default function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell>
      <WorkReader workId={id} />
    </AppShell>
  );
}
