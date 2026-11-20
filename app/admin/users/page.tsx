"use client";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminUsers } from "@/features/admin/AdminUsers";

export default function AdminUsersPage() {
  return (
    <AdminPage title="Users" needs="manageUsers">
      <AdminUsers />
    </AdminPage>
  );
}
