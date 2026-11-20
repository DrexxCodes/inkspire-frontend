"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { adminService } from "@/services/admin.service";
import { moderationService } from "@/services/moderation.service";
import { useAuth } from "@/stores/auth-store";
import { useCursorList } from "@/hooks/useCursorList";
import { useToast } from "@/stores/toast-store";
import { formatDate } from "@/utils/format";
import type { WorkDto } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, LoadMore, Spinner } from "@/components/ui/feedback";
import { SelectField } from "@/components/ui/fields";

type Act = { kind: "flag" | "unflag" | "delete" | "restore" | "purge"; work: WorkDto } | null;

export function AdminWorks() {
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const { permissions } = useAuth();
  const status = params.get("status") ?? "";
  const moderation = params.get("moderation") ?? "";
  const [act, setAct] = useState<Act>(null);
  const list = useCursorList<WorkDto>((cursor, signal) => adminService.works({ status: status || undefined, moderation: moderation || undefined, cursor }, signal), [status, moderation]);

  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(params.toString());
    if (v) n.set(k, v);
    else n.delete(k);
    router.replace(`/admin/works${n.size ? `?${n}` : ""}`);
  };
  const dropped = (w: WorkDto, msg: string) => {
    list.mutate((items) => items.filter((i) => i.id !== w.id));
    toast.success(msg);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <SelectField label="Status" value={status} onChange={(e) => setParam("status", e.target.value)}>
          <option value="">Any</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="flagged">Flagged</option>
          <option value="archived">Unpublished</option>
          <option value="deleted">Deleted</option>
        </SelectField>
        <SelectField label="Moderation" value={moderation} onChange={(e) => setParam("moderation", e.target.value)}>
          <option value="">Any</option>
          <option value="flagged">Flagged</option>
          <option value="underReview">Under review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </SelectField>
      </div>

      {list.loading && <Spinner label="Loading works" />}
      {list.error != null && <ErrorState error={list.error} onRetry={list.reload} />}
      {!list.loading && !list.error && list.items.length === 0 && <EmptyState icon="file" title="No works match these filters" />}

      {list.items.length > 0 && (
        <div className="table-wrap">
          <table className="table table--stack">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((w) => (
                <tr key={w.id}>
                  <td>
                    <Link href={`/works/${w.id}`} style={{ fontWeight: 700 }}>
                      {w.title}
                    </Link>
                  </td>
                  <td>@{w.author.username}</td>
                  <td>
                    <span className="chip chip--static">{w.status}</span>
                  </td>
                  <td>{formatDate(w.updatedAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {permissions?.moderateWorks && w.status === "published" && (
                        <Button size="sm" variant="secondary" onClick={() => setAct({ kind: "flag", work: w })}>
                          Flag
                        </Button>
                      )}
                      {permissions?.moderateWorks && w.status === "flagged" && (
                        <Button size="sm" variant="secondary" onClick={() => setAct({ kind: "unflag", work: w })}>
                          Unflag
                        </Button>
                      )}
                      {permissions?.deleteWorks && w.status !== "deleted" && (
                        <Button size="sm" variant="ghost" onClick={() => setAct({ kind: "delete", work: w })}>
                          Delete
                        </Button>
                      )}
                      {permissions?.deleteWorks && w.status === "deleted" && (
                        <Button size="sm" variant="secondary" onClick={() => setAct({ kind: "restore", work: w })}>
                          Restore
                        </Button>
                      )}
                      {permissions?.permanentlyDeleteWorks && w.status === "deleted" && (
                        <Button size="sm" variant="danger" onClick={() => setAct({ kind: "purge", work: w })}>
                          Delete forever
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />

      <ConfirmDialog
        open={act?.kind === "flag"}
        onClose={() => setAct(null)}
        title="Flag this work"
        confirmLabel="Flag work"
        tone="danger"
        reasonLabel="Reason shown to the author"
        reasonRequired
        onConfirm={async (reason) => {
          if (!act) return;
          await moderationService.flag(act.work.id, reason.trim());
          list.mutate((items) => items.map((i) => (i.id === act.work.id ? { ...i, status: "flagged", moderationStatus: "flagged" } : i)));
          toast.success("Work flagged");
        }}
      >
        The work is hidden from readers and the author is told why.
      </ConfirmDialog>

      <ConfirmDialog
        open={act?.kind === "unflag"}
        onClose={() => setAct(null)}
        title="Remove the flag?"
        confirmLabel="Unflag"
        reasonLabel="Note (optional)"
        reasonRequired={false}
        onConfirm={async (note) => {
          if (!act) return;
          await moderationService.unflag(act.work.id, note.trim() || undefined);
          list.mutate((items) => items.map((i) => (i.id === act.work.id ? { ...i, status: "published", moderationStatus: "clean" } : i)));
          toast.success("Flag removed");
        }}
      >
        The work becomes visible again.
      </ConfirmDialog>

      <ConfirmDialog
        open={act?.kind === "delete"}
        onClose={() => setAct(null)}
        title="Delete this work?"
        confirmLabel="Delete"
        tone="danger"
        onConfirm={async () => {
          if (!act) return;
          await adminService.deleteWork(act.work.id);
          dropped(act.work, "Work deleted. You can restore it later.");
        }}
      >
        It is hidden from everyone but stays recoverable.
      </ConfirmDialog>

      <ConfirmDialog
        open={act?.kind === "restore"}
        onClose={() => setAct(null)}
        title="Restore this work?"
        confirmLabel="Restore"
        onConfirm={async () => {
          if (!act) return;
          await adminService.restoreWork(act.work.id);
          dropped(act.work, "Work restored");
        }}
      >
        It returns to the state it had before deletion.
      </ConfirmDialog>

      <ConfirmDialog
        open={act?.kind === "purge"}
        onClose={() => setAct(null)}
        title="Delete forever?"
        confirmLabel="Delete forever"
        tone="danger"
        onConfirm={async () => {
          if (!act) return;
          await adminService.permanentlyDeleteWork(act.work.id);
          dropped(act.work, "Work permanently deleted");
        }}
      >
        This removes the work, its versions and its text. It cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
