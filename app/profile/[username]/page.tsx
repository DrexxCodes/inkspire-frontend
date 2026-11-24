import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";
import { clip, fetchProfile, jsonLd } from "@/lib/seo";
import { ProfilePageClient } from "./ProfilePageClient";

type Props = { params: Promise<{ username: string }> };

const handle = (p: { username: string }) => `@${p.username}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = decodeURIComponent((await params).username);
  const profile = await fetchProfile(username);
  if (!profile || profile.accountStatus !== "active") {
    return { title: "Inkspire", robots: { index: false, follow: false } };
  }

  const name = profile.displayName;
  const title = `${name} (${handle(profile)})`;
  const works = profile.stats.publishedWorks;
  const bio = clip(profile.bio, 150);
  // Their own words when they wrote a bio, otherwise an invitation that still says something about them.
  const description = bio
    ? `${bio} ${works > 0 ? `${works} ${works === 1 ? "work" : "works"} on Inkspire.` : "Join them on Inkspire."}`
    : works > 0
      ? `${name} has published ${works} ${works === 1 ? "work" : "works"} on Inkspire. Join ${name} on Inkspire to read, write and share your own stories, poems and essays.`
      : `Join ${name} on Inkspire to write stories, poems and essays, and share them with people who love words.`;
  const url = `/profile/${profile.username}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title,
      description,
      siteName: "Inkspire",
      username: profile.username,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProfilePage({ params }: Props) {
  const username = decodeURIComponent((await params).username);
  const profile = await fetchProfile(username);
  const ok = profile && profile.accountStatus === "active";
  return (
    <>
      {ok && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "ProfilePage",
              mainEntity: {
                "@type": "Person",
                name: profile.displayName,
                alternateName: profile.username,
                description: profile.bio ? clip(profile.bio, 200) : undefined,
                image: profile.profilePhotoUrl ?? undefined,
                url: `${SITE_URL}/profile/${profile.username}`,
              },
            }),
          }}
        />
      )}
      <ProfilePageClient username={username} />
    </>
  );
}
