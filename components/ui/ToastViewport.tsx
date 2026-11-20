"use client";

import { useToast } from "@/stores/toast-store";
import { Icon } from "./Icon";

export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="toasts" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`} role={t.tone === "error" ? "alert" : "status"}>
          <span className="toast__text">{t.message}</span>
          <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
            <Icon name="x" size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
