import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { AuthProvider } from "@/stores/auth-store";
import { ToastProvider } from "@/stores/toast-store";
import { JoinPromptProvider } from "@/stores/join-prompt-store";
import { InstallProvider } from "@/stores/install-store";
import { ToastViewport } from "@/components/ui/ToastViewport";
import { ZoomLock } from "@/components/layout/ZoomLock";
import { SITE_URL } from "@/lib/config";
import { PullToRefresh } from "@/components/layout/PullToRefresh";
import { OverscrollLock } from "@/components/layout/OverscrollLock";
import { Splash } from "@/components/layout/Splash";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/ui.css";
import "@/styles/overlay.css";
import "@/styles/layout.css";
import "@/styles/work.css";
import "@/styles/profile.css";
import "@/styles/billboard.css";
import "@/styles/admin.css";
import "@/styles/auth.css";
import "@/styles/install.css";
import "@/styles/pull.css";
import "@/styles/splash.css";

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
  metadataBase: new URL(SITE_URL),
  title: { default: "Inkspire", template: "%s | Inkspire" },
  description: "A home for stories, poems and essays, written and read by people who love words.",
  applicationName: "Inkspire",
  openGraph: {
    type: "website",
    siteName: "Inkspire",
    title: "Inkspire",
    description: "A home for stories, poems and essays, written and read by people who love words.",
    images: [{ url: "/logo.png" }],
  },
  twitter: { card: "summary_large_image" },
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

const STANDALONE_SCRIPT = `try{if(navigator.standalone||matchMedia("(display-mode: standalone)").matches)document.documentElement.setAttribute("data-standalone","true")}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${newsreader.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks an installed app before anything paints, so the launch splash (styles/splash.css) is there from the first frame. */}
        <script dangerouslySetInnerHTML={{ __html: STANDALONE_SCRIPT }} />
      </head>
      <body>
        <ZoomLock />
        <OverscrollLock />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ToastProvider>
          <InstallProvider>
            <AuthProvider>
              <Splash />
              <JoinPromptProvider>
                <div id="app-root">
                  <PullToRefresh>{children}</PullToRefresh>
                </div>
              </JoinPromptProvider>
            </AuthProvider>
          </InstallProvider>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}