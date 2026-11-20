import type { Role } from "@/types/api";

/** UX mirror of the backend rules. It only hides buttons, the backend still refuses anything not allowed. */
export const ROLE_RANK: Record<Role, number> = { user: 0, moderator: 1, admin: 2, super_admin: 3 };
export const ROLES: Role[] = ["user", "moderator", "admin", "super_admin"];
export const ROLE_LABEL: Record<Role, string> = { user: "User", moderator: "Moderator", admin: "Admin", super_admin: "Super admin" };

export function canManageUser(actor: { uid: string; role: Role }, target: { id: string; role: Role }): boolean {
  if (actor.uid === target.id) return false;
  return actor.role === "super_admin" || ROLE_RANK[target.role] < ROLE_RANK[actor.role];
}

export function assignableRoles(actorRole: Role): Role[] {
  return ROLES.filter((r) => actorRole === "super_admin" || ROLE_RANK[r] < ROLE_RANK[actorRole]);
}
