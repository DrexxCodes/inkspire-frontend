"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RouteGate } from "@/components/layout/RouteGate";
import { WorkEditor } from "@/features/editor/WorkEditor";

function Editor({ id }: { id: string }) {
  const revision = useSearchParams().get("revision");
  return <WorkEditor workId={id} revisionId={revision} />;
}

export default function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell wide>
      <RouteGate>
        <Suspense>
          <Editor id={id} />
        </Suspense>
      </RouteGate>
    </AppShell>
  );
}
