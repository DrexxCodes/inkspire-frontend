"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/stores/auth-store";
import { decideGate } from "@/lib/gate";
import type { Permissions } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/feedback";

interface Props {
  children: ReactNode;
  /** When set, the signed in person must also hold this permission. */
  needs?: keyof Permissions;
}

/** Keeps signed out, unfinished and restricted accounts out of pages that need a full account. */
export function RouteGate({ children, needs }: Props) {
  const { status, permissions, refresh, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const decision = decideGate(status, permissions, needs);

  useEffect(() => {
    if (decision === "login") router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    if (decision === "complete-profile") router.replace("/auth/register?step=profile");
  }, [decision, router, pathname]);

  if (decision === "allow") return <>{children}</>;
  if (decision === "wait" || decision === "login" || decision === "complete-profile") {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "50dvh" }}>
        <Spinner label="Checking your account" />
      </div>
    );
  }
  if (decision === "restricted") {
    return (
      <EmptyState icon="lock" title="Your account is restricted" action={<Button variant="secondary" onClick={() => signOut()}>Sign out</Button>}>
        You can still read public works, but writing and commenting are turned off. Contact support if you think this is a mistake.
      </EmptyState>
    );
  }
  if (decision === "forbidden") {
    return <EmptyState icon="shield" title="You do not have access to this page">Ask an administrator if you need it.</EmptyState>;
  }
  return <ErrorState error={new Error("We could not reach Inkspire.")} onRetry={() => refresh()} title="Connection problem" />;
}
