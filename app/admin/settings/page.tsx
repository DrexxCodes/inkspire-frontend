"use client";

import { AdminPage } from "@/components/admin/AdminPage";
import { PlatformSettings } from "@/features/admin/PlatformSettings";

export default function PlatformSettingsPage() {
  return (
    <AdminPage title="Platform" needs="managePlatform">
      <PlatformSettings />
    </AdminPage>
  );
}
