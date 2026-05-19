import { useEffect } from "react";
import PostCard, { MediumCard } from "../components/PostCard";
import { posts } from "../data/posts";
import { mediumPosts } from "../data/medium";
import type { BlogPost } from "../data/posts";
import type { MediumPost } from "../data/medium";

type WritingEntry =
  | { kind: "post"; post: BlogPost }
  | { kind: "medium"; post: MediumPost };

export default function Writing() {
  useEffect(() => {
    document.title = "Writing — Rameez Khan";
  }, []);

  const allEntries: WritingEntry[] = [
    ...posts.map((p) => ({ kind: "post" as const, post: p })),
    ...mediumPosts.map((p) => ({ kind: "medium" as const, post: p })),
  ].sort(
    (a, b) => new Date(b.post.date).getTime() - new Date(a.post.date).getTime(),
  );

  return (
    <div className="writing-page">
      <h1>/writing</h1>
      <p className="page-subtitle">
        Essays, articles, and deep dives on data engineering, tools, and whatever else I'm thinking about.
      </p>
      <hr />

      {allEntries.map((entry, i) => {
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
