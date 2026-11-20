"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth-store";

/**
 * Returns a guard for actions that need an account. When signed out it sends the person to
 * the sign in page and brings them back afterwards. Returns true when the action may continue.
 */
export function useRequireSignIn() {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(() => {
    if (status === "ready") return true;
    router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
    return false;
  }, [status, router, pathname]);
}
