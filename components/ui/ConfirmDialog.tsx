"use client";

import { useEffect, useState, type ReactNode } from "react";
import { errorMessage } from "@/lib/api/errors";
import { Button } from "./Button";
import { TextAreaField } from "./fields";
import { ResponsiveSheet } from "./Overlay";

interface Props {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  tone?: "default" | "danger";
  /** Ask for a written reason. The confirm button stays disabled until one is entered. */
  reasonLabel?: string;
  reasonRequired?: boolean;
  onConfirm: (reason: string) => Promise<unknown> | void;
  onClose: () => void;
}

/**
 * Confirmation for destructive or consequential actions. Keeps the dialog open and shows the
 * error if the action fails, so nothing is silently lost.
 */
export function ConfirmDialog({ open, title, children, confirmLabel, tone = "default", reasonLabel, reasonRequired = true, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const needsReason = !!reasonLabel && reasonRequired && reason.trim().length === 0;

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveSheet
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={confirm} loading={busy} disabled={needsReason}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="stack">
        {children && <div className="muted">{children}</div>}
        {reasonLabel && <TextAreaField data-autofocus label={reasonLabel} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} />}
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </ResponsiveSheet>
  );
}
