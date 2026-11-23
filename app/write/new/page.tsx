"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { RouteGate } from "@/components/layout/RouteGate";
import { WorkEditor } from "@/features/editor/WorkEditor";

function Editor() {
  // /write/new?prompt=<id> starts a work for that prompt.
  const promptId = useSearchParams().get("prompt") ?? undefined;
  return <WorkEditor promptId={promptId} />;
}

export default function NewWorkPage() {
  return (
    <AppShell wide>
      <RouteGate>
        <Suspense>
          <Editor />
        </Suspense>
      </RouteGate>
    </AppShell>
  );
}
