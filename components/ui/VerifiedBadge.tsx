"use client";

import { useState } from "react";
import { Button } from "./Button";
import { ResponsiveSheet } from "./Overlay";

/** Scalloped seal outline, drawn once so server and client markup always match. */
const SEAL_PATH =
  "M23.35 12.00L23.24 12.59L22.91 13.15L22.43 13.65L21.86 14.10L21.30 14.49L20.82 14.86L20.47 15.25L20.29 15.69L20.26 16.21L20.34 16.81L20.45 17.49L20.54 18.20L20.52 18.90L20.36 19.53L20.03 20.03L19.53 20.36L18.90 20.52L18.20 20.54L17.49 20.45L16.81 20.34L16.21 20.26L15.69 20.29L15.25 20.47L14.86 20.82L14.49 21.30L14.10 21.86L13.65 22.43L13.15 22.91L12.59 23.24L12.00 23.35L11.41 23.24L10.85 22.91L10.35 22.43L9.90 21.86L9.51 21.30L9.14 20.82L8.75 20.47L8.31 20.29L7.79 20.26L7.19 20.34L6.51 20.45L5.80 20.54L5.10 20.52L4.47 20.36L3.97 20.03L3.64 19.53L3.48 18.90L3.46 18.20L3.55 17.49L3.66 16.81L3.74 16.21L3.71 15.69L3.53 15.25L3.18 14.86L2.70 14.49L2.14 14.10L1.57 13.65L1.09 13.15L0.76 12.59L0.65 12.00L0.76 11.41L1.09 10.85L1.57 10.35L2.14 9.90L2.70 9.51L3.18 9.14L3.53 8.75L3.71 8.31L3.74 7.79L3.66 7.19L3.55 6.51L3.46 5.80L3.48 5.10L3.64 4.47L3.97 3.97L4.47 3.64L5.10 3.48L5.80 3.46L6.51 3.55L7.19 3.66L7.79 3.74L8.31 3.71L8.75 3.53L9.14 3.18L9.51 2.70L9.90 2.14L10.35 1.57L10.85 1.09L11.41 0.76L12.00 0.65L12.59 0.76L13.15 1.09L13.65 1.57L14.10 2.14L14.49 2.70L14.86 3.18L15.25 3.53L15.69 3.71L16.21 3.74L16.81 3.66L17.49 3.55L18.20 3.46L18.90 3.48L19.53 3.64L20.03 3.97L20.36 4.47L20.52 5.10L20.54 5.80L20.45 6.51L20.34 7.19L20.26 7.79L20.29 8.31L20.47 8.75L20.82 9.14L21.30 9.51L21.86 9.90L22.43 10.35L22.91 10.85L23.24 11.41Z";

function Seal({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={SEAL_PATH} fill="currentColor" />
      <path d="m7.9 12.3 2.8 2.8 5.5-5.9" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  /** The creator's display name, used in the explanation sheet. */
  name: string;
  size?: number;
  /** false renders a plain badge with no sheet (inside links and clickable rows). */
  interactive?: boolean;
}

/**
 * Verification badge shown beside a creator's name. Tapping it opens a short explanation:
 * a bottom sheet on phones, a drawer on tablets and a dialog on larger screens.
 */
export function VerifiedBadge({ name, size = 18, interactive = true }: Props) {
  const [open, setOpen] = useState(false);

  if (!interactive) {
    return (
      <span className="verified" role="img" aria-label="Verified creator" title="Verified creator">
        <Seal size={size} />
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className="verified verified--btn"
        aria-label={`${name} is a verified creator. Learn what this means`}
        title="Verified creator"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Seal size={size} />
      </button>
      <ResponsiveSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Verified creator"
        footer={<Button onClick={() => setOpen(false)}>Got it</Button>}
      >
        <div className="verified-sheet">
          <span className="verified verified-sheet__seal">
            <Seal size={64} />
          </span>
          <p>
            <strong>{name}</strong> has been conferred a verification badge that illustrates their dexterity in the art of writing.
          </p>
          <p className="muted">Inkspire offers this badge to deserving creators. You don&apos;t have to apply for this, we issue based on the authenticity and richness of your works.</p>
        </div>
      </ResponsiveSheet>
    </>
  );
}
