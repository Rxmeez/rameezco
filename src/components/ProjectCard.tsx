import type { Project } from "../data/projects";

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  return (
    <div className="project-card">
      <div className="project-meta">{project.year}</div>
      <h3 className="project-title">{project.title}</h3>
      <p className="project-desc">{project.description}</p>
      <div className="project-tags">
        {project.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
      <div className="project-links">
        {project.url && (
          <a
            className="project-link"
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
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
          >
            Source &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
