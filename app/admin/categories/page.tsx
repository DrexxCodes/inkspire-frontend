"use client";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminCategories } from "@/features/admin/AdminCategories";

export default function AdminCategoriesPage() {
  return (
    <AdminPage title="Categories" needs="manageCategories">
      <AdminCategories />
    </AdminPage>
  );
}
