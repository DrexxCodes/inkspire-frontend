import { ImageResponse } from "next/og";
import { avatarForCard, clip, fetchWork } from "@/lib/seo";

/** Preview card for works without a cover image: title, opening lines and the author. 1200 x 630. */
export const alt = "A work on Inkspire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await fetchWork(id);
  const public_ = work && work.status === "published" && work.visibility === "public";
  const title = public_ ? clip(work.title, 90) : "Inkspire";
  const body = public_ ? clip(work.excerpt || work.description, 220) : "A home for stories, poems and essays.";
  const author = public_ ? work.author.displayName : null;
  const avatar = public_ ? await avatarForCard(work.author.profilePhotoUrl, work.author.username) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#e9defa", color: "#0b1530" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {public_ && (
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#4a4f6a", marginBottom: 24 }}>{work.category.name}</div>
          )}
          <div style={{ display: "flex", fontSize: title.length > 50 ? 60 : 76, fontWeight: 800, lineHeight: 1.08 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.4, color: "#3b4160", marginTop: 28 }}>{body}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} width={72} height={72} alt="" style={{ borderRadius: 36, marginRight: 20 }} />
            )}
            {author && <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>{author}</div>}
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>Inkspire</div>
        </div>
      </div>
    ),
    size,
  );
}
