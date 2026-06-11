import { posts } from "../data/posts";
import { mediumPosts } from "../data/medium";
import { notes } from "../data/notes";
import { triggerNodeGuide } from "../components/NodeGuide";

// Node's constellation: every post or note the visitor reads becomes a dot
// Node has "collected". Stored locally — no accounts, no server.
const VISITED_KEY = "node-constellation";
const MILESTONE_KEY = "node-constellation-milestones";

const MILESTONES: { fraction: number; message: string }[] = [
  { fraction: 0.25, message: "You've explored a quarter of the graph ✨" },
  { fraction: 0.5, message: "Half the graph explored! Node is impressed." },
  { fraction: 1, message: "You've read everything on this site. Node salutes you 🫡" },
];

export function totalNodes(): number {
  return posts.length + mediumPosts.length + notes.length;
}

export function getVisited(): string[] {
  try {
    return JSON.parse(localStorage.getItem(VISITED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function recordVisit(kind: "post" | "note", slug: string) {
  const id = `${kind}:${slug}`;
  const visited = getVisited();
  if (visited.includes(id)) return;
  visited.push(id);
  try {
    localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
  } catch {
    return;
  }

  const fired = new Set<number>(
    JSON.parse(localStorage.getItem(MILESTONE_KEY) ?? "[]") as number[],
  );
  const fraction = visited.length / totalNodes();
  for (const m of MILESTONES) {
    if (fraction >= m.fraction && !fired.has(m.fraction)) {
      fired.add(m.fraction);
      localStorage.setItem(MILESTONE_KEY, JSON.stringify([...fired]));
      // Let the page settle before Node celebrates
      setTimeout(() => triggerNodeGuide(m.message, "default", "celebrate", 5000), 1500);
      break;
    }
  }
}
