"use client";

import { use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PromptDetail } from "@/features/billboard/PromptDetail";

export default function PromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell>
      <PromptDetail id={id} />
    </AppShell>
  );
}
