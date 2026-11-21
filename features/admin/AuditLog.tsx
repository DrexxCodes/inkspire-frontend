"use client";

import { useState } from "react";
import { adminService } from "@/services/admin.service";
import { useCursorList } from "@/hooks/useCursorList";
import { formatDateTime, humanizeAction } from "@/utils/format";
import type { AuditRow } from "@/types/api";
import { EmptyState, ErrorState, LoadMore, Spinner } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/fields";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function AuditLog() {
  const [action, setAction] = useState("");
  const da = useDebouncedValue(action.trim(), 350);
  // The audit endpoint pages by a "before" timestamp, which arrives as the cursor.
  const list = useCursorList<AuditRow>((cursor, signal) => adminService.auditLogs({ action: da || undefined, before: cursor }, signal), [da]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ maxWidth: 360 }}>
        <TextField label="Filter by action" placeholder="for example role_changed" value={action} onChange={(e) => setAction(e.target.value)} />
      </div>
      {list.loading && <Spinner label="Loading audit log" />}
      {list.error != null && <ErrorState error={list.error} onRetry={list.reload} />}
      {!list.loading && !list.error && list.items.length === 0 && <EmptyState icon="history" title="No entries">Admin actions will be recorded here.</EmptyState>}
      {list.items.length > 0 && (
        <div className="table-wrap table-wrap--stack">
          <table className="table table--stack">
            <thead>
              <tr>
                <th>Action</th>
                <th>When</th>
                <th>Target</th>
                <th>By</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((r) => (
                <tr key={r.id}>
                  <td data-label="" style={{ fontWeight: 700 }}>
                    {humanizeAction(r.action)}
                  </td>
                  <td data-label="When">{formatDateTime(r.created_at)}</td>
                  <td data-label="Target">
                    {r.target_type} <span className="small muted">{r.target_id}</span>
                  </td>
                  <td data-label="By" className="small" style={{ overflowWrap: "anywhere" }}>{r.admin_id}</td>
                  <td data-label="Details" className="small cell--details" style={{ overflowWrap: "anywhere" }}>
                    {Object.keys(r.metadata ?? {}).length ? JSON.stringify(r.metadata) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
    </div>
  );
}
