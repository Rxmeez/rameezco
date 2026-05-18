# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-18
**Repo:** rameez.co
**Stack:** React 19 + Vite 6 + TypeScript 5.8

## OVERVIEW
Personal portfolio / digital garden with interactive knowledge graph. Content stored as TypeScript arrays (content-as-code). Deployed to GitHub Pages.

## STRUCTURE

```
src/
├── components/     # 11 React components — UI primitives + Graph
│   ├── Graph.tsx           # D3 force-directed graph on Canvas (495 lines)
│   ├── PostGraph.tsx       # Subgraph widget for posts (2-hop BFS)
│   ├── Backlinks.tsx       # Wiki-style bidirectional links
│   ├── Header.tsx          # Nav + mobile hamburger menu
│   ├── ThemeSelector.tsx   # 5-theme dropdown with localStorage
│   └── Footer.tsx          # Social links + dynamic year
├── pages/          # 8 route components (React Router)
│   ├── Home.tsx
│   ├── Writing.tsx         # Post index with Medium integration
│   ├── WritingPost.tsx     # Individual post + syntax highlighting
│   ├── WritingGraph.tsx    # Full-page immersive graph
│   ├── Notes.tsx
│   ├── NotesPost.tsx
│   ├── Projects.tsx
│   └── Now.tsx
├── data/           # Static content as TypeScript arrays
│   ├── site.ts             # SITE config + NAV array
│   ├── posts.ts            # 3 blog posts (HTML content strings)
│   ├── medium.ts           # 4 Medium cross-posts (external links)
│   ├── notes.ts            # 4 technical notes (wikilink syntax [[slug]])
│   └── projects.ts         # 3 portfolio projects
├── lib/
│   └── graph.ts            # Graph builder: buildFullGraph(), buildSubgraph(), extractWikilinks()
├── App.tsx         # React Router v7: 9 routes, nested under MainLayout
├── main.tsx        # Entry: PostHog init + BrowserRouter
└── index.css       # 1200+ lines, 5 themes via CSS custom properties
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add a blog post | `src/data/posts.ts` | Add to `posts` array; use `[[slug]]` for cross-links |
| Add a note | `src/data/notes.ts` | Shorter format; same wikilink syntax |
| Add a project | `src/data/projects.ts` | Tags connect to graph automatically |
| Change nav links | `src/data/site.ts` | Edit `NAV` array |
| Change theme colors | `src/index.css` | Edit CSS custom properties under `[data-theme="X"]` |
| Modify graph physics | `src/components/Graph.tsx` | D3 forceSimulation parameters (lines 148-158) |
| Add syntax language | `src/pages/WritingPost.tsx` | `hljs.registerLanguage("lang", module)` |
| Analytics events | `src/main.tsx`, `src/App.tsx` | PostHog init + custom pixel tracking |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `App` | component | `src/App.tsx` | Router root: 9 routes + ScrollToTop + Analytics |
| `MainLayout` | component | `src/components/MainLayout.tsx` | Header + Outlet + Footer wrapper |
| `Graph` | component | `src/components/Graph.tsx` | D3 Canvas force graph: zoom/pan/drag/highlight |
| `buildFullGraph` | function | `src/lib/graph.ts` | Builds nodes/edges from all data sources |
| `buildSubgraph` | function | `src/lib/graph.ts` | BFS extraction up to N hops from root slug |
| `extractWikilinks` | function | `src/lib/graph.ts` | Parses `[[slug]]` from HTML strings |
| `posts` | const | `src/data/posts.ts` | BlogPost[] array with HTML content |
| `mediumPosts` | const | `src/data/medium.ts` | MediumPost[] array (external articles) |
| `notes` | const | `src/data/notes.ts` | Note[] array (shorter reference pieces) |
| `projects` | const | `src/data/projects.ts` | Project[] array |
| `SITE` | const | `src/data/site.ts` | Site metadata: title, url, socials |
| `NAV` | const | `src/data/site.ts` | Navigation links array |

## CONVENTIONS

**Components:**
- Default exports only. PascalCase filenames. Functional components.
- No custom hooks directory — hooks used inline (useState, useEffect, useRef, useMemo, useCallback).
- No barrel exports (`components/index.ts`). Import directly: `import Header from "./components/Header"`.

**Data:**
- Content stored as TypeScript arrays, not MDX or CMS.
- Interfaces co-located with data (e.g., `MediumPost` interface + `mediumPosts` array in same file).
- HTML content strings in `content` field. Wikilink syntax: `[[slug]]` for cross-references.
- Slug-based routing: `slug: "my-post-title"` → route `/writing/my-post-title`.

**CSS:**
- Single monolithic `index.css` (no CSS Modules, no Tailwind).
- CSS custom properties for theming: `--bg`, `--fg`, `--accent`, `--font-mono`, etc.
- 5 themes: `industrial` (dark default), `paper`, `neon`, `mono`, `sepia`.
- Theme switch: `document.documentElement.setAttribute("data-theme", theme)`.
- Section markers: `/* ── Hero ── */`.

**Imports:**
- Relative paths with `../` for cross-directory. No path aliases configured.
- Highlight.js languages registered modularly (not full bundle).

## ANTI-PATTERNS (THIS PROJECT)

- **No ESLint / Prettier / tests.** Code style is manual. No CI quality gates.
- **Monolithic CSS.** 1200+ lines in single file. Splitting risks theme variable drift.
- **HTML strings in data files.** XSS risk if untrusted input added. No Markdown processing.
- **No `.env.example`.** Required vars: `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN`, `VITE_PUBLIC_POSTHOG_HOST`.
- **No README.** Onboarding requires reading this AGENTS.md or exploring files.
- **Astro remnants in `.astro/`.** Not in dependencies — appears abandoned. Remove or clarify.

## UNIQUE STYLES

**Knowledge Graph (signature feature):**
- D3 force-directed graph rendered on HTML5 Canvas (not SVG) for performance.
- Node types color-coded: post, note, tag, project. Radius scales with `sqrt(linkCount)`.
- Adjacency highlighting: hovering a node dims non-connected nodes to 3-15% opacity.
- Theme-aware: reads CSS custom properties via `getComputedStyle(document.documentElement)`.
- Subgraph widget on post pages shows 2-hop neighborhood via BFS.

**Wiki-style Backlinks:**
- Bidirectional link navigation. "This post links to" (outgoing) + "Posts linking here" (incoming).
- Parsed from `[[slug]]` syntax in HTML content strings at graph build time.

**Custom Analytics:**
- Dual tracking: PostHog + custom pixel (`/_analytics?...`) with localStorage deduplication.
- PostHog event names: `hero_cta_clicked`, `writing_post_opened`, `medium_link_clicked`, etc.

**Theme System:**
- Persistence: `localStorage.getItem("theme")` → `document.documentElement.setAttribute("data-theme")`.
- Graph.tsx uses `MutationObserver` to detect theme changes and redraw canvas.

## COMMANDS

```bash
# Development
npm run dev          # Vite dev server (localhost:5173)

# Build
npm run build        # tsc -b && vite build → dist/

# Preview production build locally
npm run preview

# Deploy (automated via GitHub Actions on push to main)
git push origin main
```

## NOTES

**SPA Routing on GitHub Pages:**
GitHub Pages doesn't support client-side routing. CI copies `dist/index.html` → `dist/404.html` so all routes serve the React app. This is the standard GitHub Pages SPA workaround.

**PostHog Setup:**
Add `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` as GitHub repository secrets. Used in `.github/workflows/deploy.yml` at build time.

**Graph.tsx Complexity:**
495 lines. Handles D3 simulation, Canvas rendering, mouse interactions (drag/pan/zoom), ResizeObserver, and theme detection. Changes here affect the entire site's signature feature.

**Content Updates:**
Any change to `src/data/*.ts` requires a full rebuild and deploy. Content is baked into the bundle at build time — no runtime fetching.

**Missing Tooling:**
- No testing framework (Vitest, Jest, Playwright).
- No linting (ESLint) or formatting (Prettier, Biome).
- No type-checking in CI — only `npm run build`.
