import { ImageResponse } from "next/og";
import { avatarForCard, clip, coverForCard, fetchProfile } from "@/lib/seo";

/** Preview card for a profile: their cover photo as a banner (when they have one), their photo (or Dicebear face), name, handle and a line about them. 1200 x 630. */
export const alt = "A writer on Inkspire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const username = decodeURIComponent((await params).username);
  const profile = await fetchProfile(username);
  const ok = profile && profile.accountStatus === "active";
  const name = ok ? profile.displayName : "Inkspire";
  const works = ok ? profile.stats.publishedWorks : 0;
  const line = ok
    ? profile.bio
      ? clip(profile.bio, 140)
      : `Join ${name} on Inkspire to write stories, poems and essays.`
    : "A home for stories, poems and essays.";
  const [avatar, cover] = ok ? await Promise.all([avatarForCard(profile.profilePhotoUrl, profile.username), coverForCard(profile.coverPhotoUrl)]) : [null, null];

  // With a cover photo the card becomes a mini profile: banner on top, photo overlapping it, details underneath.
  const avatarSize = cover ? 176 : 220;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#dbe7ff", color: "#0b1530" }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} width={1200} height={230} alt="" style={{ width: 1200, height: 230, objectFit: "cover" }} />
        )}
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between", padding: cover ? "0 72px 48px" : 72 }}>
          <div style={{ display: "flex", alignItems: cover ? "flex-start" : "center", marginTop: cover ? -80 : 0 }}>
            {avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} width={avatarSize} height={avatarSize} alt="" style={{ borderRadius: avatarSize / 2, marginRight: 48, border: "6px solid #ffffff" }} />
            )}
            <div style={{ display: "flex", flexDirection: "column", maxWidth: 800, marginTop: cover ? 96 : 0 }}>
              <div style={{ display: "flex", fontSize: name.length > 22 || cover ? 60 : 72, fontWeight: 800, lineHeight: 1.1 }}>{clip(name, 36)}</div>
              {profile && ok && <div style={{ display: "flex", fontSize: 32, color: "#4a4f6a", marginTop: 6 }}>@{profile.username}</div>}
              {profile && works > 0 && (
                <div style={{ display: "flex", fontSize: 26, fontWeight: 700, marginTop: cover ? 12 : 20 }}>
                  {works} {works === 1 ? "work" : "works"} · {profile.stats.likesReceived} likes
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: cover ? 30 : 36, lineHeight: 1.35, color: "#2c3354" }}>{cover ? clip(line, 110) : line}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>Inkspire</div>
        </div>
      </div>
    ),
    size,
  );
}
