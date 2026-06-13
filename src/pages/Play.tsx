import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import SeoMeta from "../components/SeoMeta";
import { SITE } from "../data/site";

const TerminalTypist = lazy(() => import("../games/TerminalTypist"));
const WalkToProd = lazy(() => import("../games/WalkToProd"));

const GAMES = [
  {
    id: "typist",
    label: "terminal-typist",
    title: "Terminal Typist — a game with Node",
    description:
      "Type the falling words — harvested from my writing — before they hit the prompt line. Node handles the lasers.",
  },
  {
    id: "walk",
    label: "walk-to-prod",
    title: "Walk to Prod — QWOP for a legless mascot",
    description:
      "Node grew ragdoll legs and has to physically walk a deploy from localhost to production. Q/W hips, O/P knees.",
  },
] as const;

export default function Play() {
  const [params, setParams] = useSearchParams();
  const game = params.get("g") === "walk" ? GAMES[1] : GAMES[0];

  return (
    <div className="play-page">
      <SeoMeta title={game.title} description={game.description} url={`${SITE.url}/play`} />

      <nav className="play-tabs" aria-label="Games">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`play-tab${g.id === game.id ? " play-tab-active" : ""}`}
            onClick={() => setParams(g.id === "typist" ? {} : { g: g.id }, { replace: true })}
          >
            ./{g.label}
          </button>
        ))}
      </nav>

      <Suspense fallback={<div className="graph-skeleton">Loading game...</div>}>
        {game.id === "walk" ? <WalkToProd /> : <TerminalTypist />}
      </Suspense>
    </div>
  );
}
