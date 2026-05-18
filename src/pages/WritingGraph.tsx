import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { buildFullGraph } from "../lib/graph";
import type { GraphNode } from "../lib/graph";
import Graph from "../components/Graph";

export default function WritingGraph() {
  useEffect(() => {
    document.title = "Graph — Rameez Khan";
  }, []);

  const graphData = useMemo(() => buildFullGraph(), []);
  const [filterId, setFilterId] = useState<string | null>(null);

  const nodeMap = useMemo(
    () => new Map(graphData.nodes.map((n) => [n.id, n])),
    [graphData.nodes],
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setFilterId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleBgClick = useCallback(() => {
    setFilterId(null);
  }, []);

  // Build subgraph: clicked node + level 1 connections
  const filteredGraph = useMemo(() => {
    if (!filterId) return graphData;

    const connectedIds = new Set<string>([filterId]);
    for (const e of graphData.edges) {
      if (e.from === filterId) connectedIds.add(e.to);
      if (e.to === filterId) connectedIds.add(e.from);
    }

    const filteredNodes = graphData.nodes.filter((n) => connectedIds.has(n.id));
    const filteredEdges = graphData.edges.filter(
      (e) => connectedIds.has(e.from) && connectedIds.has(e.to),
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [filterId, graphData]);

  const filterNode = filterId ? nodeMap.get(filterId) : null;

  function nodeUrl(node: GraphNode) {
    if (node.type === "post") return `/writing/${node.id}`;
    if (node.type === "project") return "/projects";
    if (node.type === "note") return `/notes/${node.id}`;
    return "/writing";
  }

  function typeBadge(type: string) {
    const map: Record<string, string> = { post: "P", tag: "T", project: "R", note: "N" };
    return map[type] ?? "?";
  }

  function typeColor(type: string): string {
    const map: Record<string, string> = {
      post: "var(--graph-post)",
      tag: "var(--graph-tag)",
      project: "var(--graph-project)",
      note: "var(--graph-note)",
    };
    return map[type] ?? "var(--fg)";
  }

  return (
    <div className="graph-fullpage">
      <div className="graph-page-header">
        <h1>/graph</h1>
        <p className="page-subtitle">
          {filterNode
            ? `Showing ${filteredGraph.nodes.length} node${filteredGraph.nodes.length !== 1 ? "s" : ""} connected to "${filterNode.label}".`
            : `${graphData.nodes.length} nodes connected by ${graphData.edges.length} links. Click a node to explore.`}
        </p>
      </div>

      <Graph
        data={filteredGraph}
        onNodeClick={handleNodeClick}
        onBgClick={handleBgClick}
        highlightedId={filterId}
        rootId={filterId}
      />

      {filterNode && (
        <div className="filter-bar">
          <span className="filter-label">Exploring:</span>
          <span className="filter-badge" style={{ borderColor: typeColor(filterNode.type) }}>
            <span className="filter-badge-dot" style={{ background: typeColor(filterNode.type) }} />
            {typeBadge(filterNode.type)} {filterNode.label}
          </span>
          <button className="graph-btn" onClick={() => setFilterId(null)} type="button">
            clear
          </button>
        </div>
      )}

      {filterNode && (
        <>
          <hr />
          <section>
            <h2 className="section-heading">
              Connected
              <span style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 400, marginLeft: "0.5rem" }}>
                ({filteredGraph.nodes.length - 1})
              </span>
            </h2>
            <ul className="post-index">
              {filteredGraph.nodes
                .filter((n) => n.id !== filterId)
                .map((node) => {
                  const totalEdges = filteredGraph.edges.filter(
                    (e) => e.from === node.id || e.to === node.id,
                  ).length;
                  return (
                    <li key={node.id} className="post-index-item">
                      <Link to={nodeUrl(node)} className="post-index-link">
                        <span className="post-index-title">
                          <span className="node-type-badge" style={{ background: typeColor(node.type), borderColor: typeColor(node.type), color: "var(--bg)" }}>
                            {typeBadge(node.type)}
                          </span>{" "}
                          {node.label}
                        </span>
                        <span className="post-index-count">
                          {totalEdges} link{totalEdges !== 1 ? "s" : ""}
                        </span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
