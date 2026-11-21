/**
 * Pure rules for the pull to refresh gesture (see components/layout/PullToRefresh.tsx).
 * Kept free of the DOM so they can be unit tested. All distances are in CSS pixels.
 */
export const PULL = {
  /** Finger travel before we decide whether the gesture is a pull or a normal scroll. */
  slop: 10,
  /** Finger travel at the top of the page that is ignored, so a casual drag never shows anything. */
  deadZone: 24,
  /** How much of the finger travel (beyond the dead zone) the spinner follows. */
  resistance: 0.6,
  /** Spinner distance at which letting go refreshes. */
  trigger: 64,
  /** The furthest the spinner can be pulled. */
  max: 96,
  /** Where the spinner rests while refreshing. */
  hold: 64,
  /** The spinner stays at least this long, so the turn is always seen. */
  minSpinMs: 900,
  /** Degrees the logo turns per pixel pulled. */
  degPerPx: 5,
} as const;

export type PullIntent = "undecided" | "pull" | "scroll";

/**
 * Decides what a drag that started at the very top of the page is. Only a clearly downward,
 * mostly vertical drag is a pull. Anything else (scrolling down the page, swiping sideways
 * through a carousel) is left alone for the browser to handle.
 */
export function pullIntent(dx: number, dy: number): PullIntent {
  if (Math.hypot(dx, dy) < PULL.slop) return "undecided";
  return dy > 0 && dy > Math.abs(dx) * 1.5 ? "pull" : "scroll";
}

/** Spinner distance for a given finger travel. Zero inside the dead zone, then resisted and capped. */
export function pullDistance(dy: number): number {
  if (dy <= PULL.deadZone) return 0;
  return Math.min(PULL.max, (dy - PULL.deadZone) * PULL.resistance);
}

export const shouldRefresh = (distance: number): boolean => distance >= PULL.trigger;

/** 0 to 1, how far towards the trigger the spinner is. */
export const pullProgress = (distance: number): number => Math.min(1, Math.max(0, distance / PULL.trigger));

export const pullRotation = (distance: number): number => distance * PULL.degPerPx;

/**
 * Pages where a refresh would throw away something the person is typing. The editor (new or existing)
 * and the sign in / register forms keep the normal behaviour: no pull to refresh.
 */
export function canPullOn(pathname: string): boolean {
  if (pathname === "/auth" || pathname.startsWith("/auth/")) return false;
  if (/^\/write\/[^/]+\/?$/.test(pathname)) return false; // /write/new and /write/[id]
  return true;
}
