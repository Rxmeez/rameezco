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
      for (const tag of entry.post.tags) tagSet.add(tag);
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

      <div className="feed-head">
        <h1 className="feed-title">/writing</h1>
      </div>

      <div className="feed-term">
        <div className="feed-term-bar">
          <span className="feed-term-id">node@rameez.co — git log writing/</span>
          <span className="feed-term-count">{allEntries.length} posts</span>
        </div>

        {allTags.length > 0 && (
          <div className="feed-filter-bar">
            <button
              type="button"
              className={`feed-filter-btn ${activeTag === null ? "active" : ""}`}
              onClick={() => setActiveTag(null)}
            >
              all
            </button>
            {allTags.map((tag) => (
              <button
                type="button"
                key={tag}
                className={`feed-filter-btn ${activeTag === tag ? "active" : ""}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="feed-entries">
          {filteredEntries.map((entry, i) => {
            const style = { "--i": i } as React.CSSProperties;
            return entry.kind === "post" ? (
              <PostCard key={entry.post.slug} post={entry.post} style={style} />
            ) : (
              <MediumCard key={entry.post.slug} post={entry.post} style={style} />
            );
          })}
        </div>

        <div className="feed-term-foot">
          <span className="feed-prompt">$</span>
          <span className="feed-term-cmd">
            {filteredEntries.length} of {allEntries.length} posts
            {activeTag ? ` — filtered: ${activeTag}` : ""}
          </span>
          <span className="feed-cursor" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
