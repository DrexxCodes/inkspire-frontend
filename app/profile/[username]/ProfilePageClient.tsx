"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ProfileView } from "@/features/profile/ProfileView";

export function ProfilePageClient({ username }: { username: string }) {
  return (
    <AppShell wide>
      <ProfileView username={username} />
    </AppShell>
  );
}
