"use client";

import { Suspense } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminWorks } from "@/features/admin/AdminWorks";

export default function AdminWorksPage() {
  return (
    <AdminPage title="Works" needs="moderateWorks">
      <Suspense>
        <AdminWorks />
      </Suspense>
    </AdminPage>
  );
}
