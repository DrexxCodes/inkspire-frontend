/**
 * Pure helpers for the "Install Inkspire" guide: which device and browser someone is on, and the
 * steps that apply to them. Kept free of React and `window` so it can be unit tested.
 */

export type InstallOs = "ios" | "android" | "desktop";
export type InstallBrowser = "safari" | "chrome" | "edge" | "firefox" | "samsung" | "other";

export interface InstallEnv {
  os: InstallOs;
  browser: InstallBrowser;
}

/**
 * Works out the device and browser from the user agent string.
 * `maxTouchPoints` is needed because iPadOS 13+ Safari identifies itself as a Mac.
 */
export function detectInstallEnv(userAgent: string, maxTouchPoints = 0): InstallEnv {
  const ua = userAgent;
  const iPadOs = /Macintosh/.test(ua) && maxTouchPoints > 1;
  const os: InstallOs = /iPhone|iPad|iPod/.test(ua) || iPadOs ? "ios" : /Android/.test(ua) ? "android" : "desktop";

  let browser: InstallBrowser = "other";
  // Order matters: Edge and Samsung Internet also say "Chrome/", and Chrome on iOS says "Safari/".
  if (/SamsungBrowser/.test(ua)) browser = "samsung";
  else if (/EdgiOS|EdgA|Edg\//.test(ua)) browser = "edge";
  else if (/FxiOS|Firefox/.test(ua)) browser = "firefox";
  else if (/CriOS|Chrome\/|Chromium\//.test(ua)) browser = "chrome";
  else if (/Safari\//.test(ua)) browser = "safari";
  return { os, browser };
}

/** Icons the guide can show next to a step. Names match components/ui/Icon.tsx. */
export type StepIcon = "upload" | "plus" | "more" | "download";

export interface InstallStep {
  text: string;
  icon?: StepIcon;
}

export interface InstallGuideContent {
  label: string;
  steps: InstallStep[];
  note?: string;
}

export const INSTALL_OS_LABELS: Record<InstallOs, string> = {
  ios: "iPhone & iPad",
  android: "Android",
  desktop: "Computer",
};

/** Browser to assume when showing instructions for a device the reader is not on. */
const DEFAULT_BROWSER: Record<InstallOs, InstallBrowser> = { ios: "safari", android: "chrome", desktop: "chrome" };

export function installGuide(os: InstallOs, browser: InstallBrowser = DEFAULT_BROWSER[os]): InstallGuideContent {
  if (os === "ios") {
    return {
      label: INSTALL_OS_LABELS.ios,
      steps: [
        { text: "Tap the Share button in your browser. It looks like this:", icon: "upload" },
        { text: "Scroll down in the share sheet and tap Add to Home Screen.", icon: "plus" },
        { text: "Tap Add in the top corner. Inkspire now opens like an app from your home screen." },
      ],
      note: browser === "safari" ? undefined : "Can't see Add to Home Screen? Open this page in Safari and try again.",
    };
  }

  if (os === "android") {
    if (browser === "firefox") {
      return {
        label: INSTALL_OS_LABELS.android,
        steps: [
          { text: "Tap the menu button (three dots) in your browser.", icon: "more" },
          { text: "Tap Install.", icon: "download" },
          { text: "Confirm with Add. Inkspire is added to your home screen." },
        ],
      };
    }
    return {
      label: INSTALL_OS_LABELS.android,
      steps: [
        { text: "Tap the menu button (three dots) in your browser.", icon: "more" },
        { text: "Tap Install app. On some phones it is called Add to Home screen.", icon: "download" },
        { text: "Confirm with Install. Inkspire is added to your home screen and app list." },
      ],
    };
  }

  // Desktop
  if (browser === "safari") {
    return {
      label: INSTALL_OS_LABELS.desktop,
      steps: [
        { text: "In the menu bar choose File, then Add to Dock. You can also use the Share button." },
        { text: "Click Add. Inkspire opens in its own window from your Dock." },
      ],
      note: "Needs Safari 17 on macOS Sonoma or newer.",
    };
  }
  if (browser === "firefox") {
    return {
      label: INSTALL_OS_LABELS.desktop,
      steps: [],
      note: "Firefox on a computer can't install web apps. Open Inkspire in Chrome, Edge or Safari to install it.",
    };
  }
  return {
    label: INSTALL_OS_LABELS.desktop,
    steps: [
      { text: "Look for the install icon at the right end of the address bar and click it.", icon: "download" },
      { text: "No icon? Open the browser menu (three dots) and choose Install Inkspire. In Edge it is under Apps.", icon: "more" },
      { text: "Click Install. Inkspire opens in its own window and can be pinned to your taskbar or dock." },
    ],
  };
}
