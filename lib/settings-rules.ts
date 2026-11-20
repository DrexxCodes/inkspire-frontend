import type { PlatformSettings } from "@/types/api";

/** Same bounds as the backend, so the form can explain a bad value before the request is sent. */
export const SETTING_LIMITS = {
  contentChunkThresholdBytes: { min: 16_384, max: 900_000, label: "Chunk size (bytes)" },
  maxWorkSizeBytes: { min: 1_024, max: 50_000_000, label: "Largest allowed work (bytes)" },
  maxCommentLength: { min: 1, max: 10_000, label: "Comment length (characters)" },
  maxBioLength: { min: 0, max: 2_000, label: "Bio length (characters)" },
} as const;

export type NumericSetting = keyof typeof SETTING_LIMITS;

export function validateSettings(s: Pick<PlatformSettings, NumericSetting>): Partial<Record<NumericSetting, string>> {
  const out: Partial<Record<NumericSetting, string>> = {};
  (Object.keys(SETTING_LIMITS) as NumericSetting[]).forEach((k) => {
    const { min, max } = SETTING_LIMITS[k];
    const v = s[k];
    if (!Number.isInteger(v)) out[k] = "Enter a whole number.";
    else if (v < min || v > max) out[k] = `Use a value from ${min.toLocaleString("en")} to ${max.toLocaleString("en")}.`;
  });
  return out;
}

/** Only the fields that changed, so an edit never overwrites someone else's concurrent change. */
export function changedSettings(before: PlatformSettings, after: PlatformSettings): Partial<PlatformSettings> {
  const patch: Record<string, unknown> = {};
  (Object.keys(after) as (keyof PlatformSettings)[]).forEach((k) => {
    if (after[k] !== before[k]) patch[k] = after[k];
  });
  return patch as Partial<PlatformSettings>;
}
