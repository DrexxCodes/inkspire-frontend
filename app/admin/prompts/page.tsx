"use client";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminPrompts } from "@/features/admin/AdminPrompts";

export default function AdminPromptsPage() {
  return (
    <AdminPage title="Prompts" needs="managePrompts">
      <AdminPrompts />
    </AdminPage>
  );
}
