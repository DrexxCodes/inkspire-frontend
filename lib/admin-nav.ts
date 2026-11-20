import type { IconName } from "@/components/ui/Icon";
import type { Permissions } from "@/types/api";

export interface AdminNavEntry {
  href: string;
  label: string;
  icon: IconName;
  needs: keyof Permissions;
}

/** Menu entries are hidden when the role lacks the permission. The backend still enforces every call. */
export const ADMIN_NAV: AdminNavEntry[] = [
  { href: "/admin", label: "Dashboard", icon: "chart", needs: "viewAnalytics" },
  { href: "/admin/moderation", label: "Moderation", icon: "flag", needs: "moderateWorks" },
  { href: "/admin/works", label: "Works", icon: "file", needs: "moderateWorks" },
  { href: "/admin/users", label: "Users", icon: "users", needs: "manageUsers" },
  { href: "/admin/categories", label: "Categories", icon: "tag", needs: "manageCategories" },
  { href: "/admin/settings", label: "Platform", icon: "sliders", needs: "managePlatform" },
  { href: "/admin/audit", label: "Audit log", icon: "history", needs: "managePlatform" },
];

export function visibleAdminNav(p: Permissions | null): AdminNavEntry[] {
  return p ? ADMIN_NAV.filter((e) => p[e.needs]) : [];
}
