import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { errorMessage } from "@/lib/api/errors";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" style={{ display: "inline-flex" }}>
      <span className="spinner" aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

export function Skeleton({ width = "100%", height = 16, radius, className }: { width?: number | string; height?: number | string; radius?: number | string; className?: string }) {
  return <span className={cn("skeleton", className)} style={{ width, height, borderRadius: radius }} aria-hidden="true" />;
}

/** Placeholder shaped like a WorkCard so the page does not jump when content arrives. */
export function WorkCardSkeleton() {
  return (
    <div className="work-card tint-blue" aria-hidden="true" style={{ opacity: 0.55 }}>
      <div className="work-card__head">
        <Skeleton width={40} height={40} radius="50%" />
        <Skeleton width={120} height={14} />
      </div>
      <Skeleton width="70%" height={26} />
      <Skeleton height={14} />
      <Skeleton width="85%" height={14} />
    </div>
  );
}

export function EmptyState({ icon = "book", title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state">
      <span className="state__icon">
        <Icon name={icon} size={24} />
      </span>
      <h2 className="state__title">{title}</h2>
      {children && <p className="state__body">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "We could not load this" }: { error: unknown; onRetry?: () => void; title?: string }) {
  return (
    <div className="state" role="alert">
      <span className="state__icon" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
        <Icon name="alert" size={24} />
      </span>
      <h2 className="state__title">{title}</h2>
      <p className="state__body">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Banner({
  tone = "info",
  icon = "alert",
  title,
  children,
  actions,
}: {
  tone?: "info" | "warn" | "danger";
  icon?: IconName;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={cn("banner", tone === "warn" && "banner--warn", tone === "danger" && "banner--danger")} role={tone === "info" ? "status" : "alert"}>
      <span className="banner__icon">
        <Icon name={icon} size={22} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="banner__title">{title}</div>
        {children}
        {actions && <div className="banner__actions">{actions}</div>}
      </div>
    </div>
  );
}

/** "Load more" for cursor lists. Shows a spinner while the next page is being fetched. */
export function LoadMore({ hasMore, loading, onClick }: { hasMore: boolean; loading: boolean; onClick: () => void }) {
  if (!hasMore) return null;
  return (
    <div className="load-more">
      <Button variant="secondary" onClick={onClick} loading={loading}>
        Load more
      </Button>
    </div>
  );
}
