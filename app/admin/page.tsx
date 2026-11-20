"use client";

import { AdminPage } from "@/components/admin/AdminPage";
import { Dashboard } from "@/features/admin/Dashboard";

export default function AdminDashboardPage() {
  return (
    <AdminPage title="Dashboard" needs="viewAnalytics">
      <Dashboard />
    </AdminPage>
  );
}
