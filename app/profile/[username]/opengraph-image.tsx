import { ImageResponse } from "next/og";
import { avatarForCard, clip, fetchProfile } from "@/lib/seo";

/** Preview card for a profile: their photo (or Dicebear face), name, handle and a line about them. 1200 x 630. */
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
  const avatar = ok ? await avatarForCard(profile.profilePhotoUrl, profile.username) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#dbe7ff", color: "#0b1530" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} width={220} height={220} alt="" style={{ borderRadius: 110, marginRight: 48, border: "6px solid #ffffff" }} />
          )}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
            <div style={{ display: "flex", fontSize: name.length > 22 ? 56 : 72, fontWeight: 800, lineHeight: 1.1 }}>{clip(name, 36)}</div>
            {profile && ok && <div style={{ display: "flex", fontSize: 34, color: "#4a4f6a", marginTop: 8 }}>@{profile.username}</div>}
            {profile && works > 0 && (
              <div style={{ display: "flex", fontSize: 28, fontWeight: 700, marginTop: 20 }}>
                {works} {works === 1 ? "work" : "works"} · {profile.stats.likesReceived} likes
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 36, lineHeight: 1.35, color: "#2c3354" }}>{line}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>Inkspire</div>
      </div>
    ),
    size,
  );
}
