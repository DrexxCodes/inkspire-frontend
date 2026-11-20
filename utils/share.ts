import type { ShareTarget } from "@/types/api";

/** External share URL for a platform, or null for targets handled in the browser. */
export function shareIntentUrl(target: ShareTarget, url: string, title: string): string | null {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  switch (target) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
    default:
      return null;
  }
}

export const SHARE_TARGETS: { id: ShareTarget; label: string }[] = [
  { id: "copy_link", label: "Copy link" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "x", label: "X" },
  { id: "facebook", label: "Facebook" },
  { id: "telegram", label: "Telegram" },
];
