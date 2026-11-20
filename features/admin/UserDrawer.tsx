"use client";

import { useState } from "react";
import { adminService } from "@/services/admin.service";
import { categoriesService } from "@/services/categories.service";
import { errorMessage } from "@/lib/api/errors";
import { ROLE_LABEL, assignableRoles, canManageUser } from "@/lib/admin-rules";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/stores/auth-store";
import { useToast } from "@/stores/toast-store";
import { formatDateTime, humanizeAction } from "@/utils/format";
import type { AdminUser, Permissions, Role } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState, Spinner } from "@/components/ui/feedback";
import { SelectField, Switch } from "@/components/ui/fields";
import { ResponsiveDrawer } from "@/components/ui/Overlay";

const PERMISSION_LABELS: { key: keyof Permissions; label: string; hint: string }[] = [
  { key: "moderateWorks", label: "Moderate works", hint: "Flag, unflag, approve and reject" },
  { key: "deleteWorks", label: "Delete works", hint: "Soft delete and restore" },
  { key: "permanentlyDeleteWorks", label: "Delete works forever", hint: "Cannot be undone" },
  { key: "viewAnalytics", label: "View analytics", hint: "Dashboard and reports" },
  { key: "manageCategories", label: "Manage categories", hint: "Create, rename, hide" },
  { key: "manageUsers", label: "Manage users", hint: "Disable, block, reset passwords" },
  { key: "manageRoles", label: "Manage roles", hint: "Change roles and permissions" },
  { key: "managePlatform", label: "Platform settings", hint: "Limits and feature switches" },
];

type Pending = { kind: "disable" | "block" | "reactivate" } | null;

interface Props {
  uid: string | null;
  onClose: () => void;
  onChanged: (u: AdminUser) => void;
}

export function UserDrawer({ uid, onClose, onChanged }: Props) {
  const { user: me, profile, permissions } = useAuth();
  const toast = useToast();
  const detail = useApi(() => adminService.user(uid!), [uid], !!uid);
  const cats = useApi((s) => categoriesService.listAll(s), [], !!uid);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [catOverrides, setCatOverrides] = useState<Record<string, boolean>>({});

  const u = detail.data?.user;
  const actor = me && profile ? { uid: me.uid, role: profile.role as Role } : null;
  const manageable = !!u && !!actor && permissions?.manageUsers && canManageUser(actor, { id: u.id, role: u.role });
  const rolesOk = !!u && !!actor && permissions?.manageRoles && canManageUser(actor, { id: u.id, role: u.role });

  const run = async (fn: () => Promise<{ user: AdminUser } | unknown>, ok: string) => {
    setBusy(true);
    try {
      const res = (await fn()) as { user?: AdminUser };
      if (res?.user) onChanged(res.user);
      toast.success(ok);
      detail.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const catAllowed = (id: string, fallback: boolean) => catOverrides[id] ?? detail.data?.categoryPermissions.find((p) => p.categoryId === id)?.canPost ?? fallback;

  return (
    <ResponsiveDrawer open={!!uid} onClose={onClose} title="Account">
      {detail.loading && <Spinner label="Loading account" />}
      {detail.error != null && <ErrorState error={detail.error} onRetry={detail.reload} />}
      {u && (
        <div style={{ display: "grid", gap: 24 }}>
          <div className="person">
            <Avatar name={u.displayName} seed={u.username} src={u.profilePhotoUrl} size={56} squircle />
            <div className="person__text">
              <div className="person__name">{u.displayName}</div>
              <div className="person__sub">@{u.username} · {u.email ?? "no email"}</div>
            </div>
            <span className="chip chip--static">{u.accountStatus}</span>
          </div>
          {u.statusReason && <p className="queue-card__reason">{u.statusReason}</p>}

          {!manageable && <p className="muted small">You cannot change this account. Accounts of equal or higher rank, and your own, are read only.</p>}

          {manageable && (
            <section style={{ display: "grid", gap: 10 }}>
              <h3 className="h3">Account status</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {u.accountStatus === "active" ? (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => setPending({ kind: "disable" })}>
                      Disable
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setPending({ kind: "block" })}>
                      Block
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setPending({ kind: "reactivate" })}>
                    Reactivate
                  </Button>
                )}
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => adminService.passwordReset(u.id), "Password reset email sent")}>
                  Send password reset
                </Button>
              </div>
            </section>
          )}

          {rolesOk && actor && (
            <section style={{ display: "grid", gap: 10 }}>
              <h3 className="h3">Role</h3>
              <SelectField label="Role" value={u.role} disabled={busy} onChange={(e) => run(() => adminService.setRole(u.id, e.target.value as Role), "Role updated")}>
                {Array.from(new Set<Role>([u.role, ...assignableRoles(actor.role)])).map((r) => (
                  <option key={r} value={r} disabled={!assignableRoles(actor.role).includes(r)}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </SelectField>
              <div className="perm-grid">
                {PERMISSION_LABELS.map((p) => (
                  <div key={p.key} className="perm-row">
                    <div>
                      <div className="perm-row__name">{p.label}</div>
                      <div className="perm-row__hint">{p.hint}</div>
                    </div>
                    <Switch label={p.label} checked={u.permissions[p.key]} disabled={busy} onChange={(v) => run(() => adminService.setPermissions(u.id, { [p.key]: v }), "Permission updated")} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {manageable && (cats.data?.items.length ?? 0) > 0 && (
            <section style={{ display: "grid", gap: 10 }}>
              <h3 className="h3">Where they can post</h3>
              <div className="perm-grid">
                {cats.data!.items.map((c) => (
                  <div key={c.id} className="perm-row">
                    <div className="perm-row__name">{c.name}</div>
                    <Switch
                      label={`Can post in ${c.name}`}
                      checked={catAllowed(c.id, true)}
                      onChange={async (v) => {
                        setCatOverrides((o) => ({ ...o, [c.id]: v }));
                        try {
                          await adminService.setCategoryPermission(u.id, c.id, v);
                        } catch (e) {
                          setCatOverrides((o) => ({ ...o, [c.id]: !v }));
                          toast.error(errorMessage(e));
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {detail.data && detail.data.moderationHistory.length > 0 && (
            <section style={{ display: "grid", gap: 8 }}>
              <h3 className="h3">Moderation history</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                {detail.data.moderationHistory.map((m) => (
                  <li key={m.id} className="small">
                    <strong>{humanizeAction(m.action)}</strong> on {formatDateTime(m.created_at)}
                    {m.reason && <div className="muted">{m.reason}</div>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pending?.kind === "disable"}
        onClose={() => setPending(null)}
        title="Disable this account?"
        confirmLabel="Disable"
        reasonLabel="Reason (optional)"
        reasonRequired={false}
        onConfirm={async (reason) => {
          const res = await adminService.disable(u!.id, reason || undefined);
          onChanged(res.user);
          toast.success("Account disabled");
          detail.reload();
        }}
      >
        They keep read access but cannot write, like or comment.
      </ConfirmDialog>
      <ConfirmDialog
        open={pending?.kind === "block"}
        onClose={() => setPending(null)}
        title="Block this account?"
        confirmLabel="Block"
        tone="danger"
        reasonLabel="Reason"
        onConfirm={async (reason) => {
          const res = await adminService.block(u!.id, reason);
          onChanged(res.user);
          toast.success("Account blocked");
          detail.reload();
        }}
      >
        They are signed out and cannot use the account until it is reactivated.
      </ConfirmDialog>
      <ConfirmDialog
        open={pending?.kind === "reactivate"}
        onClose={() => setPending(null)}
        title="Reactivate this account?"
        confirmLabel="Reactivate"
        reasonLabel="Note (optional)"
        reasonRequired={false}
        onConfirm={async (reason) => {
          const res = await adminService.reactivate(u!.id, reason || undefined);
          onChanged(res.user);
          toast.success("Account reactivated");
          detail.reload();
        }}
      >
        Full access is restored.
      </ConfirmDialog>
    </ResponsiveDrawer>
  );
}
