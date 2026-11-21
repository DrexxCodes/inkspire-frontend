/**
 * Pure rules for stopping the page rubber banding (see components/layout/OverscrollLock.tsx).
 * A drag is only cancelled when NOTHING under the finger can scroll any further in that direction,
 * so lists, dialogs and the page itself scroll normally until they reach their end.
 */
export interface ScrollEdge {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/** True when this scroller cannot move any further for a finger moving by `dy` (positive is down). */
export function atEdge(e: ScrollEdge, dy: number): boolean {
  if (dy > 0) return e.scrollTop <= 0; // finger down scrolls towards the top
  if (dy < 0) return e.scrollTop + e.clientHeight >= e.scrollHeight - 1; // finger up scrolls towards the end
  return false;
}

/** Only mostly vertical movement is looked at. Sideways swipes (tabs, carousels) are never blocked. */
export const isVerticalMove = (dx: number, dy: number): boolean => dy !== 0 && Math.abs(dy) > Math.abs(dx);

/**
 * `chain` is the touched element's scrollable ancestors from innermost to the page itself. The drag is blocked
 * only if every one of them is already at its edge in this direction. An empty chain blocks nothing.
 */
export function shouldBlockDrag(chain: ScrollEdge[], dy: number): boolean {
  return chain.length > 0 && chain.every((e) => atEdge(e, dy));
}
