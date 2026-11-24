"use client";

import { useEffect, useState } from "react";
import { engagementService } from "@/services/engagement.service";
import { useToast } from "@/stores/toast-store";
import { SHARE_TARGETS, shareIntentUrl } from "@/utils/share";
import type { ShareTarget } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/Overlay";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Set when sharing a work: the share is counted against it and the link points at it. */
  workId?: string;
  /** Path to share when it is not a work, for example `/profile/ada`. */
  path?: string;
  /** The text that goes with the link on platforms that take one. */
  title: string;
  /** Heading of the sheet. */
  heading?: string;
  onShared?: () => void;
}

export function ShareSheet({ open, onClose, workId, path, title, heading = "Share this work", onShared }: Props) {
  const toast = useToast();
  const [canNative, setCanNative] = useState(false);
  useEffect(() => setCanNative(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  const target = path ?? `/works/${workId}`;
  const url = typeof window === "undefined" ? "" : `${window.location.origin}${target}`;

  const record = (platform: ShareTarget) => {
    if (!workId) return; // only works have a share count
    // Counting is best effort and never blocks the share itself.
    engagementService.share(workId, platform).then((r) => r.counted && onShared?.()).catch(() => undefined);
  };

  const share = async (target: ShareTarget) => {
    if (target === "copy_link") {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
        record(target);
        onClose();
      } catch {
        toast.error("Could not copy the link. Copy it from the address bar instead.");
      }
      return;
    }
    if (target === "native_share") {
      try {
        await navigator.share({ title, url });
        record(target);
        onClose();
      } catch {
        /* the person dismissed the system sheet */
      }
      return;
    }
    const intent = shareIntentUrl(target, url, title);
    if (intent) {
      window.open(intent, "_blank", "noopener,noreferrer");
      record(target);
      onClose();
    }
  };

  return (
    <ResponsiveSheet open={open} onClose={onClose} title={heading}>
      <div className="share-grid">
        {canNative && (
          <Button variant="primary" icon="share" block onClick={() => share("native_share")}>
            Share with your device
          </Button>
        )}
        {SHARE_TARGETS.map((t) => (
          <Button key={t.id} variant="secondary" icon={t.id === "copy_link" ? "link" : "share"} block onClick={() => share(t.id)}>
            {t.label}
          </Button>
        ))}
      </div>
    </ResponsiveSheet>
  );
}
