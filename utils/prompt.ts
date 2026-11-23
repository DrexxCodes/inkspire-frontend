import type { PromptPhase } from "@/types/api";

export const PLACEMENT_LABEL: Record<number, string> = { 1: "1st place", 2: "2nd place", 3: "3rd place" };

export const PHASE_LABEL: Record<PromptPhase, string> = {
  draft: "Draft",
  upcoming: "Opens soon",
  open: "Open now",
  judging: "Being judged",
  completed: "Winners announced",
};

/** "3 days left", "5 hours left", "Closed". */
export function timeLeft(endsAt: string, now: number = Date.now()): string {
  const ms = new Date(endsAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return "Closed";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} min left`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} left`;
  return `${Math.floor(hours / 24)} days left`;
}

/** Value for <input type="datetime-local"> in the viewer's own time zone. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value (local time) back to an ISO string with a UTC offset. */
export function fromLocalInput(v: string): string {
  return new Date(v).toISOString();
}

/** Monday 00:00 to the following Sunday 23:59 (local), for the week containing `from`. */
export function weekWindow(from: Date = new Date()): { start: string; end: string } {
  const s = new Date(from);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 0, 0);
  return { start: toLocalInput(s.toISOString()), end: toLocalInput(e.toISOString()) };
}
