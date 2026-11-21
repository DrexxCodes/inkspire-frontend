/** Pure timing rules for the launch splash screen (see components/layout/Splash.tsx). */
export const SPLASH = {
  /** Never flash it for less than this, even if the sign in check is instant. */
  minMs: 1100,
  /** Never keep the person waiting longer than this, even if the check hangs (for example with no signal). */
  maxMs: 8000,
  /** How long the fade out lasts. Must match the transition in styles/splash.css. */
  fadeMs: 400,
  /** The progress bar eases towards this and only reaches 100 when the app is ready. */
  creepTo: 90,
} as const;

/** How long to wait before the splash may leave. `null` means keep waiting for the sign in check. */
export function splashLeaveDelay(settled: boolean, elapsedMs: number): number | null {
  if (elapsedMs >= SPLASH.maxMs) return 0;
  if (!settled) return null;
  return Math.max(0, SPLASH.minMs - elapsedMs);
}

/** One step of the progress bar: moves a share of the remaining distance, so it slows down as it nears the end. */
export const nextProgress = (p: number): number => Math.min(SPLASH.creepTo, p + (SPLASH.creepTo - p) * 0.08);
