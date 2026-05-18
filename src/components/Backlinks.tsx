import { Link } from "react-router-dom";
import type { GraphNode, GraphEdge } from "../lib/graph";
import { posts } from "../data/posts";

interface Props {
  currentSlug: string;
  edges: GraphEdge[];
  allNodes: GraphNode[];
}

export default function Backlinks({ currentSlug, edges, allNodes }: Props) {
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  const incomingIds = edges
    .filter((e) => e.to === currentSlug)
    .map((e) => e.from);
  const outgoingIds = edges
    .filter((e) => e.from === currentSlug && nodeMap.has(e.to) && nodeMap.get(e.to)!.type === "post")
    .map((e) => e.to);

  const incoming = incomingIds.map((id) => nodeMap.get(id)).filter(Boolean) as GraphNode[];
  const outgoing = outgoingIds.map((id) => nodeMap.get(id)).filter(Boolean) as GraphNode[];

  if (incoming.length === 0 && outgoing.length === 0) return null;

  function formatDate(id: string) {
    const post = posts.find((p) => p.slug === id);
    if (!post) return "";
    return new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function nodeUrl(node: GraphNode) {
    if (node.type === "post") return `/writing/${node.id}`;
    if (node.type === "project") return "/projects";
    if (node.type === "note") return `/notes/${node.id}`;
    return `/writing`;
  }

  return (
    <div className="backlinks">
      <hr />
      <h3 className="backlinks-heading">Linked References</h3>

      {outgoing.length > 0 && (
        <div className="backlinks-group">
          <p className="backlinks-sub">This post links to</p>
          <ul className="backlinks-list">
            {outgoing.map((node) => (
              <li key={node.id}>
                <Link to={nodeUrl(node)} className="backlink-link">
                  <span className="backlink-arrow">&rarr;</span>
                  <span className="backlink-title">{node.label}</span>
                  <span className="backlink-date">{formatDate(node.id)}</span>
                  <span className="backlink-type">{node.type}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {incoming.length > 0 && (
        <div className="backlinks-group">
          <p className="backlinks-sub">Posts linking here</p>
          <ul className="backlinks-list">
            {incoming.map((node) => (
              <li key={node.id}>
                <Link to={nodeUrl(node)} className="backlink-link">
                  <span className="backlink-arrow">&larr;</span>
                  <span className="backlink-title">{node.label}</span>
                  <span className="backlink-date">{formatDate(node.id)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
