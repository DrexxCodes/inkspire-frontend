import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";
import { clip, fetchWork, jsonLd } from "@/lib/seo";
import { WorkPageClient } from "./WorkPageClient";

type Props = { params: Promise<{ id: string }> };

/**
 * What a shared link looks like. Uses only public data: a draft, private or removed work gets the plain
 * Inkspire preview and is kept out of search engines.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const work = await fetchWork(id);
  if (!work || work.status !== "published" || work.visibility !== "public") {
    return { title: "Inkspire", robots: { index: false, follow: false } };
  }

  const author = work.author.displayName;
  const title = `${work.title} by ${author}`;
  const teaser = clip(work.excerpt || work.description, 160);
  const credit = `Read it in ${work.category.name} on Inkspire, by ${author}.`;
  const description = teaser ? `${teaser} ${credit}` : credit;
  // The work's own cover when it has one. Otherwise no image is set here, and app/works/[id]/opengraph-image.tsx
  // supplies a card made from its title, opening lines and author.
  const cover = work.coverImageUrl;
  const url = `/works/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    authors: [{ name: author, url: `/profile/${work.author.username}` }],
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "Inkspire",
      ...(cover ? { images: [{ url: cover, alt: `Cover of ${work.title}` }] } : {}),
      publishedTime: work.publishedAt ?? undefined,
      modifiedTime: work.updatedAt,
      authors: [`${SITE_URL}/profile/${work.author.username}`],
      section: work.category.name,
    },
    twitter: { card: "summary_large_image", title, description, ...(cover ? { images: [cover] } : {}) },
  };
}

export default async function WorkPage({ params }: Props) {
  const { id } = await params;
  const work = await fetchWork(id);
  const public_ = work && work.status === "published" && work.visibility === "public";
  return (
    <>
      {public_ && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: work.title,
              description: clip(work.excerpt || work.description, 200),
              articleSection: work.category.name,
              datePublished: work.publishedAt,
              dateModified: work.updatedAt,
              image: work.coverImageUrl ?? `${SITE_URL}/works/${id}/opengraph-image`,
              url: `${SITE_URL}/works/${id}`,
              author: { "@type": "Person", name: work.author.displayName, url: `${SITE_URL}/profile/${work.author.username}` },
              publisher: { "@type": "Organization", name: "Inkspire" },
              interactionStatistic: [
                { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: work.likeCount },
                { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: work.commentCount },
              ],
            }),
          }}
        />
      )}
      <WorkPageClient id={id} />
    </>
  );
}
