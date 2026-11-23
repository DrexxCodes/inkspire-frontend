"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Billboard } from "@/features/billboard/Billboard";

export default function BillboardPage() {
  return (
    <AppShell>
      <div className="page-head">
        <div>
          <h1>Billboard</h1>
          <p>A new prompt every week. Write for it, and see who won.</p>
        </div>
      </div>
      <Billboard />
    </AppShell>
  );
}
