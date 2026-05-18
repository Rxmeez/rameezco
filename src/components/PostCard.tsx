import { Link } from "react-router-dom";
import { usePostHog } from "@posthog/react";
import type { BlogPost } from "../data/posts";
import type { MediumPost } from "../data/medium";

interface Props {
  post: BlogPost;
}

interface MediumProps {
  post: MediumPost;
}

export default function PostCard({ post }: Props) {
  const posthog = usePostHog();
  return (
    <article className="post-card">
      <div className="post-meta">{post.date}</div>
      <h3 className="post-title">
        <Link to={`/writing/${post.slug}`} onClick={() => posthog?.capture("writing_post_clicked", { slug: post.slug, title: post.title, source: "writing_list" })}>{post.title}</Link>
      </h3>
      <p className="post-excerpt">{post.excerpt}</p>
    </article>
  );
}

export function MediumCard({ post }: MediumProps) {
  const posthog = usePostHog();
  return (
    <article className="post-card">
      <div className="post-meta">
        {post.date}
        <span className="medium-badge">medium</span>
        {post.publication && <span className="medium-pub">{post.publication}</span>}
      </div>
      <h3 className="post-title">
        <Link to={`/writing/${post.slug}`} onClick={() => posthog?.capture("writing_post_clicked", { slug: post.slug, title: post.title, source: "writing_list" })}>
          {post.title}
        </Link>
      </h3>
      <p className="post-excerpt">{post.excerpt}</p>
    </article>
  );
}
