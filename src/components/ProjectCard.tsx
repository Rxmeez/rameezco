import { usePostHog } from "@posthog/react";
import type { Project } from "../data/projects";

interface Props {
  project: Project;
  style?: React.CSSProperties;
}

export default function ProjectCard({ project, style }: Props) {
  const posthog = usePostHog();

  return (
    <div className="project-card" style={style}>
      <div className="project-meta">{project.year}</div>
      <h3 className="project-title">{project.title}</h3>
      <p className="project-desc">{project.description}</p>
      <div className="project-tags">
        {project.tags.map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
      <div className="project-links">
        {project.url && (
          <a
            className="project-link"
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setTimeout(() => posthog?.capture("project_link_clicked", { project: project.title, link_type: "live" }), 0)}
          >
            Live &rarr;
          </a>
        )}
        {project.repo && (
          <a
            className="project-link"
            href={project.repo}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setTimeout(() => posthog?.capture("project_link_clicked", { project: project.title, link_type: "source" }), 0)}
          >
            Source &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
