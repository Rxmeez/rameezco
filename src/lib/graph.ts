import { projects } from "../data/projects";
import { mediumPosts } from "../data/medium";
import { notes } from "../data/notes";

export type NodeType = "post" | "tag" | "project" | "note";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  linkCount: number;
  date?: string;
  parentId?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function extractWikilinks(html: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  for (const m of html.matchAll(regex)) {
    links.push(m[1].trim());
  }
  return [...new Set(links)];
}

export function buildFullGraph(): GraphData {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  // 1. Add medium post nodes + connect via tags
  for (const mp of mediumPosts) {
    nodeMap.set(mp.slug, {
      id: mp.slug,
      label: mp.title,
      type: "post",
      linkCount: 0,
      date: mp.date,
    });
    for (const tag of mp.tags) {
      const tagId = `tag:${tag}`;
      if (!nodeMap.has(tagId)) {
        nodeMap.set(tagId, {
          id: tagId,
          label: `#${tag}`,
          type: "tag",
          linkCount: 0,
        });
      }
      edges.push({ from: mp.slug, to: tagId });
    }
  }

  // 2. Add note nodes + connect via tags + cross-link with medium posts
  for (const note of notes) {
    nodeMap.set(note.slug, {
      id: note.slug,
      label: note.title,
      type: "note",
      linkCount: 0,
      date: note.date,
    });
    for (const tag of note.tags) {
      const tagId = `tag:${tag}`;
      if (!nodeMap.has(tagId)) {
        nodeMap.set(tagId, {
          id: tagId,
          label: `#${tag}`,
          type: "tag",
          linkCount: 0,
        });
      }
      edges.push({ from: note.slug, to: tagId });
    }
    const noteTagIds = note.tags.map((t) => `tag:${t}`);
    for (const mp of mediumPosts) {
      const mpTagIds = mp.tags.map((t) => `tag:${t}`);
      if (noteTagIds.filter((nt) => mpTagIds.includes(nt)).length > 0) {
        edges.push({ from: note.slug, to: mp.slug });
      }
    }
  }

  // 3. Add project nodes and connect via shared tags
  for (const project of projects) {
    const projId = slugify(project.title);
    if (!nodeMap.has(projId)) {
      nodeMap.set(projId, {
        id: projId,
        label: project.title,
        type: "project",
        linkCount: 0,
        date: project.year.toString(),
      });
    }

    const projectTagIds = project.tags.map((t) => `tag:${t.toLowerCase()}`);
    for (const mp of mediumPosts) {
      const mpTagIds = mp.tags.map((t) => `tag:${t.toLowerCase()}`);
      const overlap = projectTagIds.filter((pt) => mpTagIds.includes(pt));
      if (overlap.length > 0) {
        edges.push({ from: projId, to: mp.slug });
      }
    }
    for (const note of notes) {
      const noteTagIds = note.tags.map((t) => `tag:${t.toLowerCase()}`);
      const overlap = projectTagIds.filter((pt) => noteTagIds.includes(pt));
      if (overlap.length > 0) {
        edges.push({ from: projId, to: note.slug });
      }
    }
  }

  // 4. Count links per node
  for (const edge of edges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (from) from.linkCount++;
    if (to) to.linkCount++;
  }

  const usedNodeIds = new Set<string>();
  for (const e of edges) {
    if (nodeMap.has(e.from)) usedNodeIds.add(e.from);
    if (nodeMap.has(e.to)) usedNodeIds.add(e.to);
  }
  for (const n of nodeMap.values()) {
    if (n.type === "project") usedNodeIds.add(n.id);
  }
  const nodes = [...nodeMap.values()].filter((n) => usedNodeIds.has(n.id));

  nodes.sort((a, b) => {
    const order: Record<string, number> = { post: 0, note: 1, tag: 2, project: 3 };
    return (order[a.type] ?? 3) - (order[b.type] ?? 3);
  });

  return { nodes, edges };
}

export function buildSubgraph(
  rootSlug: string,
  depth: number,
): GraphData {
  const full = buildFullGraph();
  const fullNodeMap = new Map(full.nodes.map((n) => [n.id, n]));

  // BFS from root up to `depth` levels
  const adj = new Map<string, Set<string>>();
  for (const e of full.edges) {
    if (!adj.has(e.from)) adj.set(e.from, new Set());
    if (!adj.has(e.to)) adj.set(e.to, new Set());
    adj.get(e.from)?.add(e.to);
    adj.get(e.to)?.add(e.from);
  }

  const visited = new Map<string, number>();
  const queue: string[] = [rootSlug];
  visited.set(rootSlug, 0);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    const dist = visited.get(current);
    if (dist === undefined) continue;
    if (dist >= depth) continue;
    const neighbors = adj.get(current);
    if (!neighbors) continue;
    for (const nb of neighbors) {
      if (!visited.has(nb)) {
        visited.set(nb, dist + 1);
        queue.push(nb);
      }
    }
  }

  const subNodeIds = new Set(visited.keys());
  const subNodes = full.nodes.filter((n) => subNodeIds.has(n.id));
  const subEdges = full.edges.filter(
    (e) => subNodeIds.has(e.from) && subNodeIds.has(e.to),
  );

  return { nodes: subNodes, edges: subEdges };
}
