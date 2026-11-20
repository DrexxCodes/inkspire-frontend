"use client";

import { AppShell } from "@/components/layout/AppShell";
import { RouteGate } from "@/components/layout/RouteGate";
import { WorkEditor } from "@/features/editor/WorkEditor";

export default function NewWorkPage() {
  return (
    <AppShell wide>
      <RouteGate>
        <WorkEditor />
      </RouteGate>
    </AppShell>
  );
}
