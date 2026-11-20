/** 950 -> "950", 1200 -> "1.2k", 15300 -> "15k", 2400000 -> "2.4M" */
export function formatCount(n: number): string {
  const v = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  if (v < 1000) return String(v);
  const trim = (x: number) => String(Math.round(x * 10) / 10).replace(/\.0$/, "");
  if (v < 10_000) return `${trim(v / 1000)}k`;
  if (v < 1_000_000) return `${Math.round(v / 1000)}k`;
  return `${trim(v / 1_000_000)}M`;
}

/** "Nov 16, 2026". `timeZone` is injectable so output is deterministic in tests. */
export function formatDate(iso: string | null | undefined, timeZone?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone }).format(d);
}

export function formatDateTime(iso: string | null | undefined, timeZone?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit", timeZone }).format(d);
}

export function timeAgo(iso: string | null | undefined, now: number = Date.now(), timeZone?: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86_400) return `${Math.round(s / 3600)}h ago`;
  if (s < 7 * 86_400) return `${Math.round(s / 86_400)}d ago`;
  return formatDate(iso, timeZone);
}

/** About 230 words a minute at roughly 5.7 bytes a word. */
export function readingMinutes(totalBytes: number): number {
  return Math.max(1, Math.round(totalBytes / (5.7 * 230)));
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0]![0]! + (parts.length > 1 ? parts[parts.length - 1]![0]! : "")).toUpperCase();
}

/** "user_blocked" and "USER_BLOCKED" -> "User blocked" */
export function humanizeAction(code: string): string {
  const s = code.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
