/**
 * Layout breakpoints (px). The same numbers are used in the CSS media queries (styles/tokens.css)
 * so JavaScript and CSS always agree about which layout is active.
 */
export const BREAKPOINTS = {
  tablet: 640,
  laptop: 1024,
  desktop: 1280,
  wide: 1600,
} as const;

export type Breakpoint = "mobile" | "tablet" | "laptop" | "desktop" | "wide";

export function breakpointForWidth(width: number): Breakpoint {
  if (width >= BREAKPOINTS.wide) return "wide";
  if (width >= BREAKPOINTS.desktop) return "desktop";
  if (width >= BREAKPOINTS.laptop) return "laptop";
  if (width >= BREAKPOINTS.tablet) return "tablet";
  return "mobile";
}

export type OverlayKind = "sheet" | "drawer" | "modal";

/**
 * Responsive interaction model for dialogs:
 *   mobile  -> bottom sheet
 *   tablet  -> side drawer
 *   laptop and up -> centred modal
 * Contextual panels (details, history, filters) prefer a side panel on larger screens.
 */
export function overlayFor(bp: Breakpoint, variant: "dialog" | "panel" = "dialog"): OverlayKind {
  if (bp === "mobile") return "sheet";
  if (variant === "panel") return "drawer";
  return bp === "tablet" ? "drawer" : "modal";
}
