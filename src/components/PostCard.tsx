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
    <article className="write-entry" style={style}>
      <div className="write-entry-meta">
        <span>{post.date}</span>
        <span className="write-meta-sep">·</span>
        <span>{readingTimeMinutes(post.content)} min read</span>
      </div>
      <h3 className="write-entry-title">
        <Link
          to={`/writing/${post.slug}`}
          viewTransition
          onClick={() => setTimeout(() => posthog?.capture("writing_post_clicked", { slug: post.slug, title: post.title, source: "writing_list" }), 0)}
        >
          {post.title}
        </Link>
      </h3>
      <p className="write-entry-excerpt">{post.excerpt}</p>
      <div className="write-entry-tags">
        {post.tags.map((tag) => (
          <span key={tag} className="write-tag">{tag}</span>
        ))}
      </div>
    </article>
  );
}

export function MediumCard({ post, style }: MediumProps) {
  const posthog = usePostHog();
  return (
    <article className="write-entry" style={style}>
      <div className="write-entry-meta">
        <span>{post.date}</span>
        <span className="write-meta-sep">·</span>
        <span>{readingTimeMinutes(post.content)} min read</span>
        <span className="write-meta-sep">·</span>
        <span className="write-medium-badge">medium</span>
        {post.publication && (
          <>
            <span className="write-meta-sep">·</span>
            <span className="write-medium-pub">{post.publication}</span>
          </>
        )}
      </div>
      <h3 className="write-entry-title">
        <Link
          to={`/writing/${post.slug}`}
          viewTransition
          onClick={() => setTimeout(() => posthog?.capture("writing_post_clicked", { slug: post.slug, title: post.title, source: "writing_list" }), 0)}
        >
          {post.title}
        </Link>
      </h3>
      <p className="write-entry-excerpt">{post.excerpt}</p>
      <div className="write-entry-tags">
        {post.tags.map((tag) => (
          <span key={tag} className="write-tag">{tag}</span>
        ))}
      </div>
    </article>
  );
}
