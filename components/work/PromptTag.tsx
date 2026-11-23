import Link from "next/link";
import { PLACEMENT_LABEL } from "@/utils/prompt";
import type { WorkPromptTag } from "@/types/api";
import { Icon } from "@/components/ui/Icon";

/** Marks a work that was written for a weekly prompt. Winners also show their placement. */
export function PromptTag({ prompt }: { prompt: WorkPromptTag | null | undefined }) {
  if (!prompt) return null;
  const won = prompt.placement ? PLACEMENT_LABEL[prompt.placement] : null;
  return (
    <Link href={`/billboard/${prompt.id}`} className={won ? "prompt-tag prompt-tag--won" : "prompt-tag"} title={`Written for the prompt: ${prompt.title}`}>
      <Icon name="trophy" size={14} />
      <span className="prompt-tag__text">{won ? `${won} · ${prompt.title}` : prompt.title}</span>
    </Link>
  );
}
