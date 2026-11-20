import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { AuthProvider } from "@/stores/auth-store";
import { ToastProvider } from "@/stores/toast-store";
import { JoinPromptProvider } from "@/stores/join-prompt-store";
import { ToastViewport } from "@/components/ui/ToastViewport";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/ui.css";
import "@/styles/overlay.css";
import "@/styles/layout.css";
import "@/styles/work.css";
import "@/styles/profile.css";
import "@/styles/admin.css";
import "@/styles/auth.css";

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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${newsreader.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ToastProvider>
          <AuthProvider>
            <JoinPromptProvider>
              <div id="app-root">{children}</div>
            </JoinPromptProvider>
          </AuthProvider>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}