/** Soft surface tints used for cards. Assigned by a stable hash so a work keeps its colour. */
export const TINTS = ["blue", "cream", "rose", "mint", "lilac"] as const;
export type Tint = (typeof TINTS)[number];

export function tintFor(key: string): Tint {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length]!;
}

/**
 * Series colours for charts. Validated with the dataviz palette checker on the light surface:
 * lightness band, chroma, colour blind separation and 3:1 contrast all pass.
 * Always used in this fixed order, never cycled.
 */
export const SERIES_COLORS = ["#1f5fe0", "#c4700d", "#13917f", "#a64ac9"] as const;
