import { useEffect } from "react";
import ProjectCard from "../components/ProjectCard";
import SeoMeta from "../components/SeoMeta";
import { projects } from "../data/projects";
import { SITE } from "../data/site";
import { creativeWorkJsonLd } from "../lib/jsonLd";

export default function ProjectsPage() {
  useEffect(() => {
    document.title = "Projects — Rameez Khan";
  }, []);

  return (
    <div className="projects-page">
      <SeoMeta
        title="Projects — Rameez Khan"
        description="Projects I've built and contributed to."
        url={`${SITE.url}/projects`}
      />
      {projects[0] && <script type="application/ld+json">{creativeWorkJsonLd(projects[0])}</script>}

      <div className="proj-head">
        <h1 className="proj-title">/projects</h1>
      </div>

      <div className="proj-term">
        <div className="proj-term-bar">
          <span className="proj-term-id">node@rameez.co — cat projects/manifest.toml</span>
          <span className="proj-term-count">{projects.length} entries</span>
        </div>

        <div className="proj-entries">
          {projects.map((project, i) => (
            <ProjectCard
              key={project.slug}
              project={project}
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="proj-term-foot">
          <span className="proj-prompt">$</span>
          <span className="proj-term-cmd">ls ./projects — {projects.length} repos found</span>
          <span className="proj-cursor" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
