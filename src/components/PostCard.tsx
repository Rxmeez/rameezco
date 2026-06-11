import { Link } from "react-router-dom";
import { usePostHog } from "../lib/analytics";
import type { BlogPost } from "../data/posts";
import type { MediumPost } from "../data/medium";
import { readingTimeMinutes } from "../lib/readingTime";

interface Props {
  post: BlogPost;
  style?: React.CSSProperties;
}

interface MediumProps {
  post: MediumPost;
  style?: React.CSSProperties;
}

export default function PostCard({ post, style }: Props) {
  const posthog = usePostHog();
  return (
    <article className="post-card" style={style}>
      <div className="post-meta">
        {post.date}
        <span className="post-meta-sep" />
        <span className="post-meta-read">{readingTimeMinutes(post.content)} min read</span>
      </div>
      <h3 className="post-title">
        <Link to={`/writing/${post.slug}`} onClick={() => setTimeout(() => posthog?.capture("writing_post_clicked", { slug: post.slug, title: post.title, source: "writing_list" }), 0)}>{post.title}</Link>
      </h3>
      <p className="post-excerpt">{post.excerpt}</p>
      <div className="post-card-tags">
        {post.tags.map((tag) => (
          <span key={tag} className="post-card-tag">{tag}</span>
        ))}
      </div>
    </article>
  );
}

export function MediumCard({ post, style }: MediumProps) {
  const posthog = usePostHog();
  return (
    <article className="post-card" style={style}>
      <div className="post-meta">
        {post.date}
        <span className="post-meta-sep" />
        <span className="post-meta-read">{readingTimeMinutes(post.content)} min read</span>
        <span className="medium-badge">medium</span>
        {post.publication && <span className="medium-pub">{post.publication}</span>}
      </div>
      <h3 className="post-title">
        <Link to={`/writing/${post.slug}`} onClick={() => setTimeout(() => posthog?.capture("writing_post_clicked", { slug: post.slug, title: post.title, source: "writing_list" }), 0)}>
          {post.title}
        </Link>
      </h3>
      <p className="post-excerpt">{post.excerpt}</p>
      <div className="post-card-tags">
        {post.tags.map((tag) => (
          <span key={tag} className="post-card-tag">{tag}</span>
        ))}
      </div>
    </article>
  );
}
