import { useEffect } from "react";

interface Props {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  type?: "website" | "article";
  publishedAt?: string;
  tags?: string[];
  author?: string;
}

export default function SeoMeta({
  title,
  description,
  url,
  image,
  type = "website",
  publishedAt,
  tags,
  author = "Rameez Khan",
}: Props) {
  useEffect(() => {
    document.title = title;

    function setMeta(name: string, content: string) {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        const isOg = name.startsWith("og:") || name.startsWith("twitter:");
        el.setAttribute(isOg ? "property" : "name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    }

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description);
      setMeta("twitter:description", description);
    }

    setMeta("og:title", title);
    setMeta("twitter:title", title);
    setMeta("og:type", type);

    if (url) {
      setMeta("og:url", url);
    }

    if (image) {
      setMeta("og:image", image);
      setMeta("twitter:image", image);
    }

    if (publishedAt) {
      setMeta("article:published_time", publishedAt);
    }

    if (tags) {
      for (const tag of tags) {
        setMeta("article:tag", tag);
      }
    }

    setMeta("twitter:card", "summary_large_image");
    setMeta("author", author);

    return undefined;
  }, [title, description, url, image, type, publishedAt, tags, author]);

  return null;
}
