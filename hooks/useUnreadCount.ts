"use client";

import { useCallback, useEffect, useState } from "react";
import { notificationsService } from "@/services/notifications.service";
import { useAuth } from "@/stores/auth-store";

const POLL_MS = 60_000;

/** Unread notification count for the bell. Polls slowly and pauses while the tab is hidden. */
export function useUnreadCount() {
  const { status } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (status !== "ready") return;
    notificationsService.unreadCount().then((r) => setCount(r.count)).catch(() => undefined);
  }, [status]);

  useEffect(() => {
    if (status !== "ready") {
      setCount(0);
      return;
    }
    refresh();
    const id = setInterval(() => document.visibilityState === "visible" && refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [status, refresh]);

  /** Pass a number to set it directly, or null to ask the server again. */
  const set = useCallback((n: number | null) => (n === null ? refresh() : setCount(n)), [refresh]);
  return { count, set };
}
