import { useEffect } from "react";
import PostCard from "../components/PostCard";
import { mediumPosts } from "../data/medium";

export default function Writing() {
  useEffect(() => {
    document.title = "Writing — Rameez Khan";
  }, []);

  const allPosts = [...mediumPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <>
      <h1>/writing</h1>
      <p className="page-subtitle">
        Essays, articles, and deep dives on data engineering, tools, and whatever else I'm thinking about.
      </p>
      <hr />

      {allPosts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </>
  );
}
