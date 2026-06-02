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
      <h1>/projects</h1>
      <p>Projects I've built and contributed to.</p>
      {projects.map((project, i) => (
        <ProjectCard key={project.title} project={project} style={{ "--i": i } as React.CSSProperties} />
      ))}
    </div>
  );
}
