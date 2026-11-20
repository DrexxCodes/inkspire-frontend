"use client";

import { AppShell } from "@/components/layout/AppShell";
import { RouteGate } from "@/components/layout/RouteGate";
import { SettingsView } from "@/features/profile/SettingsView";

export default function SettingsPage() {
  return (
    <AppShell>
      <RouteGate>
        <SettingsView />
      </RouteGate>
    </AppShell>
  );
}
