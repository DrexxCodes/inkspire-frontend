"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/Overlay";

export interface JoinPromptOptions {
  /** Display name of the creator whose work the visitor tried to interact with. */
  authorName?: string;
}

interface JoinPromptApi {
  prompt: (options?: JoinPromptOptions) => void;
}

const JoinPromptContext = createContext<JoinPromptApi | null>(null);

/**
 * The "Join Inkspire" sheet shown when a signed out visitor tries to like, comment or otherwise
 * interact. Lives once at the root so any component can open it through useRequireSignIn.
 */
export function JoinPromptProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [options, setOptions] = useState<JoinPromptOptions | null>(null);
  const close = useCallback(() => setOptions(null), []);
  const prompt = useCallback((o?: JoinPromptOptions) => setOptions(o ?? {}), []);

  // Navigating away (for example to the sign in page) closes the sheet.
  useEffect(() => {
    setOptions(null);
  }, [pathname]);

  const api = useMemo<JoinPromptApi>(() => ({ prompt }), [prompt]);
  const next = encodeURIComponent(pathname || "/discover");
  const author = options?.authorName?.trim();

  return (
    <JoinPromptContext.Provider value={api}>
      {children}
      <ResponsiveSheet
        open={options !== null}
        onClose={close}
        title="Join Inkspire"
        footer={
          <>
            <ButtonLink href={`/auth/login?next=${next}`} variant="secondary">
              Sign in
            </ButtonLink>
            <ButtonLink href={`/auth/register?next=${next}`}>Create account</ButtonLink>
          </>
        }
      >
        <div className="stack">
          <p>Create, like and interact with literary creators on Inkspire.</p>
          <p className="muted">
            {author ? (
              <>
                More works from <strong>{author}</strong> and other writers like them are waiting for you when you join.
              </>
            ) : (
              "More works from writers like these are waiting for you when you join."
            )}
          </p>
          <Button variant="ghost" size="sm" onClick={close} style={{ justifySelf: "start" }}>
            Keep browsing
          </Button>
        </div>
      </ResponsiveSheet>
    </JoinPromptContext.Provider>
  );
}

export function useJoinPrompt(): JoinPromptApi {
  const ctx = useContext(JoinPromptContext);
  if (!ctx) throw new Error("useJoinPrompt must be used inside <JoinPromptProvider>");
  return ctx;
}
