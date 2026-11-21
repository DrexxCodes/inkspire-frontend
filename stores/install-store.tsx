"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { detectInstallEnv, type InstallEnv } from "@/lib/install";

/** Chromium only. Not part of lib.dom yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

interface InstallValue {
  /** null until the browser has been inspected, so the server render and the first client render match. */
  env: InstallEnv | null;
  /** True when Inkspire is already running as an installed app (or was just installed). */
  installed: boolean;
  /** True when the browser handed us a one tap install prompt (Chrome, Edge, Samsung Internet on Android and desktop). */
  canPrompt: boolean;
  promptInstall: () => Promise<InstallOutcome>;
}

const InstallContext = createContext<InstallValue | null>(null);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: minimal-ui)").matches ||
  // iOS Safari uses its own flag.
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Lives once at the root. `beforeinstallprompt` fires early and only once per page load, so it has to be
 * captured here rather than in the guide, which may not be mounted yet (for example after client navigation).
 * Also registers the (cache free) service worker that keeps that prompt available.
 */
export function InstallProvider({ children }: { children: ReactNode }) {
  const [env, setEnv] = useState<InstallEnv | null>(null);
  const [installed, setInstalled] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setEnv(detectInstallEnv(navigator.userAgent, navigator.maxTouchPoints));

    const mq = window.matchMedia("(display-mode: standalone)");
    const sync = () => setInstalled(isStandalone());
    sync();
    mq.addEventListener("change", sync);

    const onPrompt = (e: Event) => {
      e.preventDefault(); // hold it back so the guide can offer it at the right moment
      deferred.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      deferred.current = null;
      setCanPrompt(false);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Production only: a service worker in `next dev` gets in the way of hot reloading.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }

    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    const event = deferred.current;
    if (!event) return "unavailable";
    // The event can only be used once, whatever the answer.
    deferred.current = null;
    setCanPrompt(false);
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      return outcome;
    } catch {
      return "unavailable";
    }
  }, []);

  const value = useMemo<InstallValue>(() => ({ env, installed, canPrompt, promptInstall }), [env, installed, canPrompt, promptInstall]);
  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>;
}

export function useInstall(): InstallValue {
  const ctx = useContext(InstallContext);
  if (!ctx) throw new Error("useInstall must be used inside <InstallProvider>");
  return ctx;
}
