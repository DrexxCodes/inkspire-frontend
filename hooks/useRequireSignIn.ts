"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth-store";
import { useJoinPrompt, type JoinPromptOptions } from "@/stores/join-prompt-store";
import { useToast } from "@/stores/toast-store";

/**
 * Returns a guard for actions that need an account. Returns true when the action may continue.
 * A signed out visitor gets the "Join Inkspire" sheet instead of being thrown at the sign in page;
 * pass the creator's name so the sheet can speak about them.
 */
export function useRequireSignIn() {
  const { status } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { prompt } = useJoinPrompt();
  return useCallback(
    (options?: JoinPromptOptions) => {
      if (status === "ready") return true;
      if (status === "loading") return false;
      if (status === "needs-profile") {
        router.push("/auth/register?step=profile");
      } else if (status === "restricted") {
        toast.error("Your account is restricted, so this action is turned off.");
      } else if (status === "error") {
        toast.error("We could not reach Inkspire. Please try again.");
      } else {
        prompt(options);
      }
      return false;
    },
    [status, router, toast, prompt],
  );
}
