export interface Project {
  title: string;
  description: string;
  url?: string;
  repo?: string;
  tags: string[];
  year: number;
}

export const projects: Project[] = [
  {
    title: "Data Pipeline Orchestrator",
    description: "Built an event-driven pipeline orchestrator processing 10M+ events/day with Apache Kafka, Spark, and Airflow on AWS.",
    tags: ["data-engineering", "streaming", "kafka", "spark", "airflow", "aws"],
    year: 2025,
  },
  {
    title: "Real-time Analytics Dashboard",
    description: "Streaming analytics platform with sub-second latency using ClickHouse, dbt, and a custom React frontend.",
    url: "https://example.com/dashboard",
    tags: ["data-engineering", "sql", "dbt", "clickhouse", "react", "websockets"],
    year: 2024,
  },
  {
    title: "Data Quality Framework",
    description: "Open-source data validation library with Great Expectations integration and custom anomaly detection.",
    repo: "https://github.com/rameezk/data-quality",
    tags: ["data-engineering", "python", "great-expectations", "pyspark"],
    year: 2024,
  },
];
