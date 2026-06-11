import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import MainLayout from "./components/MainLayout";
import ScrollProgress from "./components/ScrollProgress";
import CookieConsent from "./components/CookieConsent";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Writing from "./pages/Writing";
import Now from "./pages/Now";
import Notes from "./pages/Notes";
import CookiePolicy from "./pages/CookiePolicy";
import NotFound from "./pages/NotFound";
import { allowsAnalytics } from "./lib/cookieConsent";

const WritingGraph = lazy(() => import("./pages/WritingGraph"));
const Play = lazy(() => import("./pages/Play"));
// Post pages carry heavy deps (highlight.js, d3 via PostGraph) — keep them
// out of the main bundle so list pages and the homepage stay light.
const WritingPost = lazy(() => import("./pages/WritingPost"));
const NotesPost = lazy(() => import("./pages/NotesPost"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Analytics() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!allowsAnalytics()) return;
    const d = new Date();
    const k = `v=${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
    const s = localStorage.getItem("_pv");
    if (s === k + pathname) return;
    localStorage.setItem("_pv", k + pathname);
    new Image().src = `/_analytics?${k}&p=${encodeURIComponent(pathname)}`;
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollProgress />
      <ScrollToTop />
      <Analytics />
      <CookieConsent />
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="projects" element={<Projects />} />
          <Route path="writing" element={<Writing />} />
          <Route path="writing/graph" element={<Navigate to="/graph" replace />} />
          <Route path="graph" element={
            <Suspense fallback={<div className="graph-skeleton">Loading graph...</div>}>
              <WritingGraph />
            </Suspense>
          } />
          <Route path="writing/:slug" element={
            <Suspense fallback={<div className="graph-skeleton">Loading...</div>}>
              <WritingPost />
            </Suspense>
          } />
          <Route path="now" element={<Now />} />
          <Route path="notes" element={<Notes />} />
          <Route path="notes/:slug" element={
            <Suspense fallback={<div className="graph-skeleton">Loading...</div>}>
              <NotesPost />
            </Suspense>
          } />
          <Route path="play" element={
            <Suspense fallback={<div className="graph-skeleton">Loading game...</div>}>
              <Play />
            </Suspense>
          } />
          <Route path="cookies" element={<CookiePolicy />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
