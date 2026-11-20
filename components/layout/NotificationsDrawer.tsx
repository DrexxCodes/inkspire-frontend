"use client";

import { useRouter } from "next/navigation";
import { notificationsService } from "@/services/notifications.service";
import { errorMessage } from "@/lib/api/errors";
import { useCursorList } from "@/hooks/useCursorList";
import { useToast } from "@/stores/toast-store";
import { timeAgo } from "@/utils/format";
import { updateById } from "@/utils/list";
import type { NotificationDto } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { ResponsiveDrawer } from "@/components/ui/Overlay";
import { EmptyState, ErrorState, LoadMore, Spinner } from "@/components/ui/feedback";

interface Props {
  open: boolean;
  onClose: () => void;
  onUnreadChange: (count: number | null) => void;
}

export function NotificationsDrawer({ open, onClose, onUnreadChange }: Props) {
  const router = useRouter();
  const toast = useToast();
  const list = useCursorList<NotificationDto>((cursor, signal) => notificationsService.list(cursor, signal), [open], open);

  const markAll = async () => {
    try {
      await notificationsService.readAll();
      list.mutate((items) => items.map((n) => ({ ...n, read: true })));
      onUnreadChange(0);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const openItem = async (n: NotificationDto) => {
    if (!n.read) {
      list.mutate((items) => updateById(items, n.id, { read: true }));
      notificationsService.read(n.id).then(() => onUnreadChange(null)).catch(() => undefined);
    }
    if (n.workId) {
      onClose();
      router.push(`/works/${n.workId}`);
    }
  };

  return (
    <ResponsiveDrawer open={open} onClose={onClose} title="Notifications">
      <div style={{ display: "grid", gap: 12 }}>
        <Button variant="ghost" size="sm" onClick={markAll} disabled={list.items.every((n) => n.read)}>
          Mark all as read
        </Button>
        {list.loading && <Spinner label="Loading notifications" />}
        {list.error != null && <ErrorState error={list.error} onRetry={list.reload} title="Could not load notifications" />}
        {!list.loading && !list.error && list.items.length === 0 && (
          <EmptyState icon="bell" title="Nothing new">
            Likes, comments and moderation updates will show up here.
          </EmptyState>
        )}
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {list.items.map((n) => (
            <li key={n.id}>
              <button type="button" className="person" style={{ width: "100%", textAlign: "left", background: n.read ? "transparent" : "#eaf1ff", borderRadius: "var(--r-md)", padding: 12 }} onClick={() => openItem(n)}>
                <span className="person__text">
                  <span className="person__name" style={{ whiteSpace: "normal" }}>{n.title}</span>
                  {n.body && <span className="person__sub" style={{ display: "block" }}>{n.body}</span>}
                  <span className="person__sub">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
      </div>
    </ResponsiveDrawer>
  );
}
