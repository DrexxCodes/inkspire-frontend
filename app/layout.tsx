import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { AuthProvider } from "@/stores/auth-store";
import { ToastProvider } from "@/stores/toast-store";
import { JoinPromptProvider } from "@/stores/join-prompt-store";
import { InstallProvider } from "@/stores/install-store";
import { ToastViewport } from "@/components/ui/ToastViewport";
import { ZoomLock } from "@/components/layout/ZoomLock";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/ui.css";
import "@/styles/overlay.css";
import "@/styles/layout.css";
import "@/styles/work.css";
import "@/styles/profile.css";
import "@/styles/admin.css";
import "@/styles/auth.css";
import "@/styles/install.css";

const figtree = localFont({
  src: "./fonts/Figtree-VariableFont_wght.ttf",
  variable: "--font-figtree",
  display: "swap",
});

const newsreader = localFont({
  src: [
    {
      path: "./fonts/Newsreader-VariableFont_opsz,wght.ttf",
      style: "normal",
    },
    {
      path: "./fonts/Newsreader-Italic-VariableFont_opsz,wght.ttf",
      style: "italic",
    },
  ],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Inkspire", template: "%s | Inkspire" },
  description: "A home for stories, poems and essays, written and read by people who love words.",
  applicationName: "Inkspire",
  // iOS "Add to Home Screen": open full screen with the right name. The manifest (app/manifest.ts) covers Android and desktop,
  // and the home screen icon comes from app/apple-icon.png.
  appleWebApp: { capable: true, title: "Inkspire", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // App feel: no pinch or double tap zoom. iOS Safari ignores these two, so <ZoomLock /> and touch-action in base.css cover it.
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${newsreader.variable}`}>
      <body>
        <ZoomLock />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ToastProvider>
          <InstallProvider>
            <AuthProvider>
              <JoinPromptProvider>
                <div id="app-root">{children}</div>
              </JoinPromptProvider>
            </AuthProvider>
          </InstallProvider>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}