"use client";

import { useEffect, useState } from "react";
import { settingsService } from "@/services/settings.service";
import type { PublicSettings } from "@/types/api";

/** Sensible fallbacks, used until the real values arrive or if the request fails. */
export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  maxCommentLength: 2000,
  maxBioLength: 500,
  allowComments: true,
  allowLikes: true,
  allowSharing: true,
  allowRegistration: true,
  maintenanceMode: false,
  maxWorkSizeBytes: 5_000_000,
};

let cached: { value: PublicSettings; at: number } | null = null;
let inflight: Promise<PublicSettings> | null = null;
const TTL = 60_000;

function load(): Promise<PublicSettings> {
  if (cached && Date.now() - cached.at < TTL) return Promise.resolve(cached.value);
  inflight ??= settingsService
    .public()
    .then((r) => {
      cached = { value: r.settings, at: Date.now() };
      return r.settings;
    })
    .catch(() => cached?.value ?? DEFAULT_PUBLIC_SETTINGS)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Shared, cached platform limits and feature flags. One request serves every component. */
export function usePublicSettings(): PublicSettings {
  const [settings, setSettings] = useState<PublicSettings>(cached?.value ?? DEFAULT_PUBLIC_SETTINGS);
  useEffect(() => {
    let alive = true;
    load().then((s) => alive && setSettings(s));
    return () => {
      alive = false;
    };
  }, []);
  return settings;
}
