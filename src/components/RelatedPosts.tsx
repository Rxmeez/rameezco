import { useMemo } from "react";
import { Link } from "react-router-dom";
import { posts } from "../data/posts";
import { notes } from "../data/notes";

interface Props {
  currentSlug: string;
  type: "post" | "note";
  tags: string[];
}

interface RelatedItem {
  slug: string;
  title: string;
  path: string;
  score: number;
}

export default function RelatedPosts({ currentSlug, type, tags }: Props) {
  const related = useMemo(() => {
    const pool = type === "post" ? posts : notes;
    const scored: RelatedItem[] = [];

    for (const item of pool) {
      if (item.slug === currentSlug) continue;

      let score = 0;
      for (const tag of tags) {
        if (item.tags.includes(tag)) score += 3;
      }
      if (score === 0) {
        const overlap = item.tags.filter((t) => tags.includes(t)).length;
        score = overlap;
      }
      if (score > 0) {
        scored.push({
          slug: item.slug,
          title: item.title,
          path: type === "post" ? `/writing/${item.slug}` : `/notes/${item.slug}`,
          score,
        });
      }
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [currentSlug, type, tags]);

  if (related.length === 0) return null;

  return (
    <div className="related-posts">
      <hr />
      <h3 className="related-posts-heading">You might also like</h3>
      <ul className="related-posts-list">
        {related.map((item) => (
          <li key={item.slug}>
            <Link to={item.path} className="related-post-link">
              <span className="related-post-arrow">&rarr;</span>
              <span className="related-post-title">{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
