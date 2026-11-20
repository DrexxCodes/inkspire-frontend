import type { ReactNode } from "react";
import type { WorkDto } from "@/types/api";
import { Banner } from "@/components/ui/feedback";

interface Props {
  work: Pick<WorkDto, "status" | "moderationStatus" | "moderation">;
  /** Buttons shown under the message, such as "Revise" and "Request review". */
  actions?: ReactNode;
}

/** What the author sees when a moderator has flagged their work. Always includes the reason. */
export function ModerationBanner({ work, actions }: Props) {
  if (work.status !== "flagged") return null;
  const reason = work.moderation?.reason?.trim();

  if (work.moderationStatus === "underReview") {
    return (
      <Banner tone="info" icon="history" title="Review requested">
        <p>A moderator will look at your revised work soon. It stays hidden from other readers until the review is finished.</p>
        {reason && <div className="banner__reason">{reason}</div>}
      </Banner>
    );
  }

  const rejected = work.moderationStatus === "rejected";
  return (
    <Banner tone="warn" icon="flag" title={rejected ? "Work flagged. Your last review was not approved" : "Work flagged"} actions={actions}>
      <div className="small" style={{ marginTop: 6, fontWeight: 600 }}>
        Reason
      </div>
      <div className="banner__reason">{reason || "A moderator flagged this work. No further explanation was recorded."}</div>
      <p style={{ marginTop: 10 }}>Your work is currently unavailable to other readers. You may revise this work and request another review.</p>
    </Banner>
  );
}
