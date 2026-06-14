import { usePostHog } from "../lib/analytics";
import type { Project } from "../data/projects";

interface Props {
  project: Project;
  style?: React.CSSProperties;
}

export default function ProjectCard({ project, style }: Props) {
  const posthog = usePostHog();

  const repoDisplay = project.repo
    ? new URL(project.repo).hostname.replace("www.", "") + new URL(project.repo).pathname
    : null;
  const liveDisplay = project.url
    ? new URL(project.url).hostname.replace("www.", "")
    : null;

  return (
    <div className="proj-entry" style={style}>
      <div className="proj-section">[{project.slug}]</div>
      <div className="proj-fields">
        <div className="proj-kv">
          <span className="proj-k">year  </span>
          <span className="proj-eq">=</span>
          <span className="proj-v">{project.year}</span>
        </div>
        <div className="proj-kv">
          <span className="proj-k">status</span>
          <span className="proj-eq">=</span>
          <span className={`proj-v proj-status-${project.status}`}>{project.status}</span>
        </div>
        <div className="proj-kv">
          <span className="proj-k">stack </span>
          <span className="proj-eq">=</span>
          <span className="proj-v proj-v-stack">{project.tags.join(" · ")}</span>
        </div>
        <div className="proj-kv proj-kv-desc">
          <span className="proj-k">desc  </span>
          <span className="proj-eq">=</span>
          <span className="proj-v proj-v-desc">"{project.description}"</span>
        </div>
        {repoDisplay && (
          <div className="proj-kv">
            <span className="proj-k">source</span>
            <span className="proj-eq">=</span>
            <a
              className="proj-v proj-link"
              href={project.repo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTimeout(() => posthog?.capture("project_link_clicked", { project: project.title, link_type: "source" }), 0)}
            >
              {repoDisplay}
            </a>
          </div>
        )}
        {liveDisplay && (
          <div className="proj-kv">
            <span className="proj-k">live  </span>
            <span className="proj-eq">=</span>
            <a
              className="proj-v proj-link"
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTimeout(() => posthog?.capture("project_link_clicked", { project: project.title, link_type: "live" }), 0)}
            >
              {liveDisplay}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
