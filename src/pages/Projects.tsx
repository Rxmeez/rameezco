import { useEffect } from "react";
import ProjectCard from "../components/ProjectCard";
import { projects } from "../data/projects";

export default function ProjectsPage() {
  useEffect(() => {
    document.title = "Projects — Rameez Khan";
  }, []);

  return (
    <>
      <h1>/projects</h1>
      <p>Projects I've built and contributed to.</p>
      <div className="project-placeholder-banner">
        <span className="project-placeholder-label">Note</span>
        <span className="project-placeholder-text">
          These are placeholder projects for demo purposes. Real projects coming soon.
        </span>
      </div>
      {projects.map((project) => (
        <ProjectCard key={project.title} project={project} />
      ))}
    </>
  );
}
