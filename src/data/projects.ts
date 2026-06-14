export interface Project {
  title: string;
  slug: string;
  description: string;
  url?: string;
  repo?: string;
  tags: string[];
  year: number;
  status: "active" | "archived" | "shipped";
}

export const projects: Project[] = [
  {
    title: "ox-db",
    slug: "ox-db",
    description: "A developer-focused database query tool built with TypeScript. Features a clean UI for writing and executing SQL queries across multiple database types.",
    repo: "https://github.com/Rxmeez/ox-db",
    tags: ["typescript", "sql", "database", "developer-tools"],
    year: 2025,
    status: "active",
  },
  {
    title: "bragdoc",
    slug: "bragdoc",
    description: "A second brain for tracking what you worked on. Built to solve the problem of forgetting your own accomplishments when it matters most — performance reviews, interviews, and 1:1s.",
    repo: "https://github.com/Rxmeez/bragdoc",
    tags: ["typescript", "productivity", "developer-tools"],
    year: 2025,
    status: "active",
  },
  {
    title: "Self-Driving Car — Behavioral Cloning",
    slug: "sdcnd-behavioral-cloning",
    description: "Udacity Self-Driving Car Nanodegree project using deep neural networks and convolutional neural networks (CNNs) to clone human driving behavior in a simulator. Built end-to-end autonomous steering prediction pipeline.",
    repo: "https://github.com/Rxmeez/SDCND-1-BehaviorialCloning",
    tags: ["machine-learning", "deep-learning", "computer-vision", "tensorflow", "python"],
    year: 2017,
    status: "archived",
  },
];
