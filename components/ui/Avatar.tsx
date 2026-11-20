"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { avatarDataUri } from "@/utils/avatar";
import { initials } from "@/utils/format";

interface Props {
  name: string;
  /** Stable seed for the generated avatar. Pass the username so it matches the backend's avatar. */
  seed?: string;
  src?: string | null;
  size?: number;
  squircle?: boolean;
  className?: string;
}

/**
 * Profile picture. Uses the uploaded or stored image when there is one. Otherwise (no image yet,
 * or the image fails to load) it draws a DiceBear avatar locally from the seed, so a new account
 * never shows a blank or initials-only placeholder. Initials are the last resort.
 */
export function Avatar({ name, seed, src, size = 40, squircle, className }: Props) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);

  const useGenerated = !src || broken;
  const generated = useMemo(() => (useGenerated ? avatarDataUri(seed || name) : null), [useGenerated, seed, name]);
  const url = useGenerated ? generated : src;

  return (
    <span className={cn("avatar", squircle && "avatar--squircle", className)} style={{ ["--size" as string]: `${size}px` }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" width={size} height={size} loading="lazy" decoding="async" onError={() => setBroken(true)} />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
      <span className="visually-hidden">{name}</span>
    </span>
  );
}
