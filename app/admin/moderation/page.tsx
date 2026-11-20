"use client";

import { AdminPage } from "@/components/admin/AdminPage";
import { ModerationQueue } from "@/features/admin/ModerationQueue";

export default function ModerationPage() {
  return (
    <AdminPage title="Review queue" needs="moderateWorks">
      <ModerationQueue />
    </AdminPage>
  );
}
