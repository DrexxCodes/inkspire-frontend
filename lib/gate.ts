import type { Permissions } from "@/types/api";

export type GateDecision = "wait" | "login" | "complete-profile" | "restricted" | "error" | "forbidden" | "allow";

/** Pure decision so the rules can be tested without rendering. */
export function decideGate(status: string, permissions: Permissions | null, needs?: keyof Permissions): GateDecision {
  switch (status) {
    case "loading":
      return "wait";
    case "anonymous":
      return "login";
    case "needs-profile":
      return "complete-profile";
    case "restricted":
      return "restricted";
    case "error":
      return "error";
    default:
      return needs && !permissions?.[needs] ? "forbidden" : "allow";
  }
}
