export interface Note {
  slug: string;
  title: string;
  date: string;
  content: string;
  tags: string[];
}

export const notes: Note[] = [
  {
    slug: "kafka-exactly-once",
    title: "Kafka Exactly-Once Semantics — Quick Reference",
    date: "2025-05-01",
    tags: ["kafka", "streaming", "distributed-systems"],
    content: `<p>Quick mental model for Kafka's exactly-once guarantees:</p>
<pre><code class="language-bash"># Idempotent producer (no duplicates within a session)
enable.idempotence=true

# Transactional producer (atomic writes across partitions)
transactional.id=my-app-01</code></pre>
<p><strong>What you actually get:</strong></p>
<ul>
  <li><strong>At-least-once</strong> by default (acks=all, retries)</li>
  <li><strong>Idempotent</strong> with <code>enable.idempotence=true</code> — deduplicates within the producer session</li>
  <li><strong>Exactly-once</strong> with transactions — atomic reads + writes across topics</li>
</ul>
<p><strong>Gotcha:</strong> Exactly-once in Kafka means "exactly once in the output topic" — not "exactly once end-to-end." Your consumer still needs to handle duplicates if it writes to an external system.</p>
<p><strong>Cost:</strong> Transactions add ~20-30% latency overhead. Worth it only when correctness requires atomicity.</p>`,
  },
  {
    slug: "python-uv-quickstart",
    title: "Switching from pip to uv — Speed Test",
    date: "2025-04-15",
    tags: ["python", "tools", "productivity"],
    content: `<p>Ran a quick benchmark on a mid-sized project (42 dependencies):</p>
<table>
<tr><th>Command</th><th>pip</th><th>uv</th></tr>
<tr><td>Install (cold)</td><td>18.2s</td><td>2.1s</td></tr>
<tr><td>Install (cached)</td><td>4.7s</td><td>0.3s</td></tr>
<tr><td>Lock file gen</td><td>—</td><td>0.8s</td></tr>
</table>
<p>uv is written in Rust. It's not just faster — it gives you a proper lockfile, virtual env management, and Python version management in one binary.</p>
<pre><code class="language-bash"># Quick start
uv init my-project
uv add fastapi uvicorn
uv run uvicorn main:app</code></pre>
<p>Switched all my side projects over. No regrets.</p>`,
  },
  {
    slug: "duckdb-tips",
    title: "DuckDB Tricks I Use Daily",
    date: "2025-03-20",
    tags: ["duckdb", "sql", "data-engineering"],
    content: `<p>Three DuckDB patterns that save me hours every week:</p>
<h3>1. Query Parquet files without loading them</h3>
<pre><code class="language-sql">SELECT * FROM 's3://bucket/data/*.parquet'
WHERE date > '2025-01-01';</code></pre>
<h3>2. Use the CLI as a quick data inspector</h3>
<pre><code class="language-bash">duckdb -c "SUMMARIZE SELECT * FROM read_csv('data.csv')"</code></pre>
<h3>3. Export query results to clipboard</h3>
<pre><code class="language-bash">duckdb -c "COPY (SELECT * FROM ...) TO '/dev/stdout' (FORMAT CSV)" | pbcopy</code></pre>
<p>DuckDB is my go-to for ad-hoc analysis. Faster than pandas, simpler than Spark, no server needed.</p>`,
  },
  {
    slug: "data-modeling-mistakes",
    title: "3 Data Modeling Mistakes I Keep Seeing",
    date: "2025-02-10",
    tags: ["data-modeling", "data-engineering", "opinion"],
    content: `<p>After reviewing a dozen data models this month, the same patterns keep showing up:</p>
<ol>
  <li><strong>Using <code>VARCHAR</code> for everything.</strong> If it's a date, use <code>DATE</code>. If it's a boolean, use <code>BOOLEAN</code>. Your downstream queries and the query planner will thank you.</li>
  <li><strong>No timezone on timestamps.</strong> <code>TIMESTAMP</code> without <code>TIMESTAMPTZ</code> is a bug waiting to happen. Always store UTC with timezone info.</li>
  <li><strong>Surrogate keys without natural keys.</strong> An auto-increment ID is fine, but if you don't also have a natural business key with a unique constraint, you'll get duplicate logic rows the moment an ETL job retries.</li>
</ol>
<p>These aren't academic. I've debugged production incidents caused by each one.</p>`,
  },
];
