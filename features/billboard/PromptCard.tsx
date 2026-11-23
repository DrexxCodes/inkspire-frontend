import Link from "next/link";
import { formatDate } from "@/utils/format";
import { PHASE_LABEL, timeLeft } from "@/utils/prompt";
import type { PromptDto } from "@/types/api";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { WinnerList } from "./WinnerList";

/** One prompt on the billboard. Finished prompts show their winners right on the card. */
export function PromptCard({ prompt, showWinners }: { prompt: PromptDto; showWinners?: boolean }) {
  const open = prompt.phase === "open";
  const when =
    prompt.phase === "open" ? timeLeft(prompt.endsAt) : prompt.phase === "upcoming" ? `Opens ${formatDate(prompt.startsAt)}` : `Ended ${formatDate(prompt.endsAt)}`;
  const href = `/billboard/${prompt.id}`;
  return (
    <article className={cn("prompt-card", open && "prompt-card--open", prompt.phase === "completed" && "prompt-card--completed")}>
      <div className="prompt-card__meta">
        <span className={open ? "chip chip--ok chip--static" : "chip chip--static"}>{PHASE_LABEL[prompt.phase]}</span>
        <span>{prompt.category.name}</span>
        <span>·</span>
        <span>{when}</span>
        <span>·</span>
        <span>
          {prompt.entryCount} {prompt.entryCount === 1 ? "entry" : "entries"}
        </span>
      </div>
      <h3 className="prompt-card__title">
        <Link href={href}>{prompt.title}</Link>
      </h3>
      {prompt.description && <p className="prompt-card__desc">{prompt.description}</p>}
      {showWinners && prompt.winners.length > 0 && <WinnerList winners={prompt.winners} compact />}
      <div className="prompt-card__actions">
        {open && prompt.viewer?.canEnter !== false && (
          <ButtonLink href={`/write/new?prompt=${prompt.id}`} icon="pen">
            Write for this prompt
          </ButtonLink>
        )}
        <ButtonLink href={href} variant="secondary">
          {open ? "See entries" : prompt.phase === "completed" ? "See all entries" : "View"}
        </ButtonLink>
      </div>
    </article>
  );
}
