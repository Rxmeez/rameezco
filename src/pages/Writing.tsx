import { useEffect, useState, useMemo } from "react";
import PostCard, { MediumCard } from "../components/PostCard";
import SeoMeta from "../components/SeoMeta";
import { posts } from "../data/posts";
import { mediumPosts } from "../data/medium";
import type { BlogPost } from "../data/posts";
import type { MediumPost } from "../data/medium";
import { SITE } from "../data/site";

type WritingEntry =
  | { kind: "post"; post: BlogPost }
  | { kind: "medium"; post: MediumPost };

export default function Writing() {
  useEffect(() => {
    document.title = "Writing — Rameez Khan";
  }, []);

  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allEntries: WritingEntry[] = [
    ...posts.map((p) => ({ kind: "post" as const, post: p })),
    ...mediumPosts.map((p) => ({ kind: "medium" as const, post: p })),
  ].sort(
    (a, b) => new Date(b.post.date).getTime() - new Date(a.post.date).getTime(),
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const entry of allEntries) {
      for (const tag of entry.post.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [allEntries]);

  const filteredEntries = activeTag
    ? allEntries.filter((e) => e.post.tags.includes(activeTag))
    : allEntries;

  return (
    <div className="writing-page">
      <SeoMeta
        title="Writing — Rameez Khan"
        description="Essays, articles, and deep dives on data engineering, tools, and whatever else I'm thinking about."
        url={`${SITE.url}/writing`}
      />
      <h1>/writing</h1>
      <p className="page-subtitle">
        Essays, articles, and deep dives on data engineering, tools, and whatever else I'm thinking about.
      </p>

      {allTags.length > 0 && (
        <div className="tag-filter">
          <button
            type="button"
            className={`tag-filter-btn ${activeTag === null ? "active" : ""}`}
            onClick={() => setActiveTag(null)}
          >
            all
          </button>
          {allTags.map((tag) => (
            <button
              type="button"
              key={tag}
              className={`tag-filter-btn ${activeTag === tag ? "active" : ""}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <hr />

      {filteredEntries.map((entry, i) => {
        const style = { "--i": i } as React.CSSProperties;
        return entry.kind === "post" ? (
          <PostCard key={entry.post.slug} post={entry.post} style={style} />
        ) : (
          <MediumCard key={entry.post.slug} post={entry.post} style={style} />
        );
      })}
    </div>
  );
}
