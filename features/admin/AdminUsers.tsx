"use client";

import { useState } from "react";
import { adminService } from "@/services/admin.service";
import { ROLE_LABEL, ROLES } from "@/lib/admin-rules";
import { useCursorList } from "@/hooks/useCursorList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate } from "@/utils/format";
import type { AdminUser, Role } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, ErrorState, LoadMore, Spinner } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/Icon";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { SelectField } from "@/components/ui/fields";
import { UserDrawer } from "./UserDrawer";

export function AdminUsers() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const dq = useDebouncedValue(q.trim(), 350);
  const list = useCursorList<AdminUser>((cursor, signal) => adminService.users({ q: dq || undefined, role: role || undefined, status: status || undefined, cursor }, signal), [dq, role, status]);

  const merge = (u: AdminUser) => list.mutate((items) => items.map((i) => (i.id === u.id ? { ...i, ...u } : i)));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", alignItems: "end" }}>
        <div className="search">
          <Icon name="search" size={20} />
          <input className="input" type="search" placeholder="Search name, username or email" aria-label="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as Role | "")}>
          <option value="">Any role</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="blocked">Blocked</option>
        </SelectField>
      </div>

      {list.loading && <Spinner label="Loading users" />}
      {list.error != null && <ErrorState error={list.error} onRetry={list.reload} />}
      {!list.loading && !list.error && list.items.length === 0 && <EmptyState icon="users" title="No users match these filters" />}

      {list.items.length > 0 && (
        <div className="table-wrap">
          <table className="table table--stack">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((u) => (
                <tr key={u.id} data-clickable="true" tabIndex={0} onClick={() => setSelected(u.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(u.id)}>
                  <td>
                    <div className="person">
                      <Avatar name={u.displayName} seed={u.username} src={u.profilePhotoUrl} size={36} squircle />
                      <div className="person__text">
                        <div className="person__name name-line">
                          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{u.displayName}</span>
                          {u.verified && <VerifiedBadge name={u.displayName} size={16} interactive={false} />}
                        </div>
                        <div className="person__sub">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>{ROLE_LABEL[u.role]}</td>
                  <td>
                    <span className={u.accountStatus === "active" ? "chip chip--static" : "chip chip--warn chip--static"}>{u.accountStatus}</span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
      <UserDrawer uid={selected} onClose={() => setSelected(null)} onChanged={merge} />
    </div>
  );
}
