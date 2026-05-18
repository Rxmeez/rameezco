import { useMemo } from "react";
import { buildSubgraph } from "../lib/graph";
import Graph from "./Graph";

interface Props {
  slug: string;
}

export default function PostGraph({ slug }: Props) {
  const subgraph = useMemo(() => buildSubgraph(slug, 2), [slug]);

  if (subgraph.nodes.length <= 1) return null;

  return (
    <div className="post-graph">
      <hr />
      <h3 className="post-graph-heading">Connection Graph</h3>
      <p className="post-graph-sub">
        {subgraph.nodes.length - 1} connected nodes within 2 hops
      </p>
      <Graph data={subgraph} rootId={slug} compact />
    </div>
  );
}
