"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/stores/auth-store";
import { SPLASH, nextProgress, splashLeaveDelay } from "@/lib/splash";
import { cn } from "@/utils/cn";

const isInstalledApp = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Launch screen for the installed app (PWA) only. It is part of the server rendered page and shown by CSS before
 * any script runs, so the signed out screen never flashes while the sign in state is being checked. It leaves once
 * the check has finished (and has been up for a moment), or after a few seconds at most.
 * In a normal browser tab it is never shown.
 */
export function Splash() {
  const { status } = useAuth();
  const [phase, setPhase] = useState<"show" | "leaving" | "gone">("show");
  const [progress, setProgress] = useState(8);
  const started = useRef(Date.now());

  // A normal browser tab has no splash: drop it straight away.
  useEffect(() => {
    if (!isInstalledApp()) setPhase("gone");
  }, []);

  useEffect(() => {
    if (phase !== "show") return;
    const id = setInterval(() => setProgress(nextProgress), 200);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "show") return;
    const elapsed = Date.now() - started.current;
    const delay = splashLeaveDelay(status !== "loading", elapsed) ?? Math.max(0, SPLASH.maxMs - elapsed);
    const id = setTimeout(() => {
      setProgress(100);
      setPhase("leaving");
    }, delay);
    return () => clearTimeout(id);
  }, [status, phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const id = setTimeout(() => setPhase("gone"), SPLASH.fadeMs);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div className={cn("splash", phase === "leaving" && "splash--leaving")} role="status" aria-label="Opening Inkspire">
      <div className="splash__bg" aria-hidden="true" />
      <div className="splash__center">
        <div className="splash__logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.png" alt="" />
        </div>
        <h1 className="splash__title">Welcome to Inkspire</h1>
        <p className="splash__tag">Stories, poems and essays, written and read by people who love words.</p>
        <div className="splash__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      </div>
      <p className="splash__credit">Powered by Drexx Technologies</p>
    </div>
  );
}
