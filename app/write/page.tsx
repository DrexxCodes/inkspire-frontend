"use client";

import { AppShell } from "@/components/layout/AppShell";
import { RouteGate } from "@/components/layout/RouteGate";
import { Studio } from "@/features/editor/Studio";

export default function StudioPage() {
  return (
    <AppShell>
      <RouteGate>
        <Studio />
      </RouteGate>
    </AppShell>
  );
}
