// Single source of truth for the CV. Feeds the /cv page, the knowledge base
// (so Node can answer experience questions), JSON-LD, and llms.txt.
// Deliberately excludes phone number — public pages get scraped.

export interface CvRole {
  title: string;
  company: string;
  period: string;
  highlights: string[];
}

export interface CvCertification {
  title: string;
  year: string;
}

export interface CvEducation {
  degree: string;
  institution: string;
  period: string;
  result?: string;
}

export const cv = {
  name: "Rameez Khan",
  headline: "Senior Data Engineer",
  location: "London, United Kingdom",
  email: "rameez.rk94@gmail.com",
  summary:
    "Results-driven engineer focusing on data infrastructure and leveraging cutting-edge tools to drive data-driven innovation.",
  roles: [
    {
      title: "Senior Data Engineer",
      company: "RVU",
      period: "Aug 2023 – Present",
      highlights: [
        "Leveraged Argo Workflows to orchestrate ETL processes, constructing scalable data ingestion pipelines that integrated diverse data sources into the data lake. Implemented ingestion from APIs, databases, and file systems, while utilising Terraform for infrastructure management.",
        "Accelerated product appearance on the website from hours to seconds by implementing a TypeScript, RxJS, and Kubernetes-based data transformation pipeline. Created a domain-specific language for the Bizops team, empowering them to manage and control data transformations efficiently.",
        "Developed a Flask-based tool for automated monitoring and alerting of BigQuery tables, improving team efficiency. Integrated Opsgenie for Slack alerts with anomaly and rule-based detection, deployed as containers on Kubernetes.",
        "Oversee team members' work, conduct 1-to-1s, and facilitated a Senior Data Analyst's transition to Data Engineer by developing their Python, SQL, and Cloud skills.",
      ],
    },
    {
      title: "Data Engineer",
      company: "RVU",
      period: "Aug 2021 – Jul 2023",
      highlights: [
        "Modularised data architecture by transforming RVU's monolithic dbt project into domain-specific dbt projects using Great Expectations and Monte Carlo, improving data contract reliability and monitoring efficiency.",
        "Implemented a new pricing model for the GCP estate, achieving a 50% annual reduction in operational expenses while maintaining optimal performance for 95% of query jobs.",
        "Migrated orchestrators from Dagster to Argo Workflows using Kustomize for job rewriting, and trained data and software engineers on technology adoption and best practices.",
      ],
    },
    {
      title: "Data Engineer",
      company: "Mobkoi",
      period: "2020 – 2021",
      highlights: [
        "Cut costs 10x by using serverless architecture on Google Cloud to move log-level data from Google Cloud Storage to BigQuery, with monitoring and alerting.",
        "Developed a data warehouse in BigQuery, collaborating with stakeholders to model data on requirements, and employed dbt for pipeline transformations, testing, and business-driven data models.",
        "Worked closely with the Lead Data Engineer to adopt best-practice approaches and integrate modern tools into the data platform.",
      ],
    },
    {
      title: "Data Analyst",
      company: "Mobkoi",
      period: "2018 – 2019",
      highlights: [
        "Optimised internal reporting, reducing report generation from an hour to under 5 minutes using Python, Jupyter Notebooks, and APIs, enabling deeper campaign analysis.",
        "Strengthened team capabilities by transitioning the team from Excel to Python and providing training in Pandas and SQL.",
      ],
    },
    {
      title: "Industrial Engineer",
      company: "Schneider Electric",
      period: "2015 – 2017",
      highlights: [
        "Enhanced productivity by developing a real-time KPI monitoring system and centralised database for the Leeds site.",
      ],
    },
  ] satisfies CvRole[],
  certifications: [
    { title: "Google Cloud Certified Professional Data Engineer", year: "2022" },
    { title: "Google Cloud Certified Professional Cloud Architect", year: "2020" },
  ] satisfies CvCertification[],
  education: [
    {
      degree: "BEng (Hons) Chemical and Nuclear Engineering",
      institution: "University of Leeds, UK",
      period: "2012 – 2015",
      result: "2.1",
    },
  ] satisfies CvEducation[],
  languages: ["Python", "SQL", "JavaScript/TypeScript", "Go"],
  technologies: [
    "GCP", "BigQuery", "dbt", "Terraform", "Kubernetes", "Argo", "Dagster",
    "Airflow", "Serverless", "MySQL", "Postgres", "AWS", "Prometheus",
    "Monte Carlo", "Git",
  ],
};

// Plain-text rendering for the knowledge base and chat page context
export function cvPlainText(): string {
  const roles = cv.roles
    .map((r) => `${r.title} at ${r.company} (${r.period}): ${r.highlights.join(" ")}`)
    .join("\n");
  const certs = cv.certifications.map((c) => `${c.title} (${c.year})`).join("; ");
  const edu = cv.education
    .map((e) => `${e.degree}, ${e.institution}, ${e.period}${e.result ? ` — ${e.result}` : ""}`)
    .join("; ");
  return `${cv.name} — ${cv.headline}, based in ${cv.location}. ${cv.summary}\n${roles}\nCertifications: ${certs}\nEducation: ${edu}\nLanguages: ${cv.languages.join(", ")}. Technologies: ${cv.technologies.join(", ")}.`;
}
