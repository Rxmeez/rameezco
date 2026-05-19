import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import MainLayout from "./components/MainLayout";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Writing from "./pages/Writing";
import WritingPost from "./pages/WritingPost";
import Now from "./pages/Now";
import Notes from "./pages/Notes";
import NotesPost from "./pages/NotesPost";
import NotFound from "./pages/NotFound";

const WritingGraph = lazy(() => import("./pages/WritingGraph"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Analytics() {
  const { pathname } = useLocation();
  useEffect(() => {
    const d = new Date();
    const k = "v=" + d.getUTCFullYear() + "-" + (d.getUTCMonth() + 1) + "-" + d.getUTCDate();
    const s = localStorage.getItem("_pv");
    if (s === k + pathname) return;
    localStorage.setItem("_pv", k + pathname);
    new Image().src = "/_analytics?" + k + "&p=" + encodeURIComponent(pathname);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Analytics />
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
          <Route path="writing/:slug" element={<WritingPost />} />
          <Route path="now" element={<Now />} />
          <Route path="notes" element={<Notes />} />
          <Route path="notes/:slug" element={<NotesPost />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
