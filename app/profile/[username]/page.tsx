"use client";

import { use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileView } from "@/features/profile/ProfileView";

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  return (
    <AppShell wide>
      <ProfileView username={decodeURIComponent(username)} />
    </AppShell>
  );
}
