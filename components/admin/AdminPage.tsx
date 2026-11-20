"use client";

import type { ReactNode } from "react";
import type { Permissions } from "@/types/api";
import { AdminShell } from "@/components/layout/AdminShell";
import { RouteGate } from "@/components/layout/RouteGate";

/** Wraps an admin screen with the shell and the permission gate it needs. */
export function AdminPage({ title, needs, actions, children }: { title: string; needs: keyof Permissions; actions?: ReactNode; children: ReactNode }) {
  return (
    <RouteGate needs={needs}>
      <AdminShell title={title} actions={actions}>
        {children}
      </AdminShell>
    </RouteGate>
  );
}
