import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface Props {
  content: string;
}

export default function TableOfContents({ content }: Props) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const h2s = Array.from(doc.querySelectorAll("h2"));
    const items = h2s.map((h2, i) => ({
      id: `heading-${i}`,
      text: h2.textContent ?? "",
      level: 2,
    }));
    setHeadings(items);
  }, [content]);

  if (headings.length < 2) return null;

  return (
    <nav className="toc" aria-label="Table of contents">
      <p className="toc-title">Contents</p>
      <ul className="toc-list">
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="toc-link">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
