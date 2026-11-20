"use client";

import { AdminPage } from "@/components/admin/AdminPage";
import { AuditLog } from "@/features/admin/AuditLog";

export default function AuditPage() {
  return (
    <AdminPage title="Audit log" needs="managePlatform">
      <AuditLog />
    </AdminPage>
  );
}
