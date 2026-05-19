export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  content: string;
}

export const posts: BlogPost[] = [
  {
    slug: "perfect-data-stack",
    title: "Why I Stopped Caring About the Perfect Data Stack",
    date: "2025-05-10",
    excerpt: "After years of chasing the ideal pipeline architecture, I realized the stack doesn't matter as much as the team building it.",
    tags: ["data-engineering", "opinion"],
    content: `<p>There's a trap in data engineering. You read about someone's stack at Airbnb or Uber — their fancy orchestration layers, their custom streaming frameworks, their perfectly governed data catalogs. And you think: <em>I need that.</em></p>
<p>You don't.</p>
<div class="mascot-aside">
<img src="/mascot.svg" alt="" width="67" height="67" class="mascot-img mascot-animated-default" />
<span class="mascot-aside-text">Node: floating by. He thinks you might be overthinking this.</span>
</div>
<h2>The Stack Is Not the Product</h2>
<p>For three years I chased the ideal pipeline. Spark on Kubernetes? Check. dbt with slim CI? Check. Airflow with dynamic DAGs? Check. DataHub for cataloging? Check.</p>
<p>What I didn't have: a team that understood <em>why</em> we were building any of this.</p>
<p>The moment I stopped worrying about the stack and started worrying about the humans, things got better. Not because the tools changed. Because the conversations did.</p>
<div class="mascot-aside">
<img src="/mascot-thinking.svg" alt="" width="67" height="67" class="mascot-img mascot-animated-thinking" />
<span class="mascot-aside-text">Node: processing this take. He suspects you already knew it.</span>
</div>
<h2>What Actually Matters</h2>
<ol><li><strong>Observability before scale.</strong> If you can't see what's broken, more data won't help.</li>
<li><strong>Contracts over schemas.</strong> Type safety at the boundary beats column-level documentation.</li>
<li><strong>The simplest thing that works.</strong> A cron job and a Python script that runs reliably is a better pipeline than a Spark cluster that fails silently.</li></ol>
<div class="mascot-aside">
<img src="/mascot-surprised.svg" alt="" width="67" height="67" class="mascot-img mascot-animated-surprised" />
<span class="mascot-aside-text">Node: surprised you read this far. He didn't think anyone would.</span>
</div>
<h2>The Takeaway</h2>
<p>Your stack should serve your team, not the other way around. If you're spending more time configuring your tooling than delivering value, step back. Build the boring thing first. The interesting stuff can wait.</p>
<p>See also: [[personal-data-warehouse]] and [[stream-processing]] for examples of choosing the right tool for the job.</p>`,
  },
  {
    slug: "personal-data-warehouse",
    title: "Building a Personal Data Warehouse for Fun",
    date: "2025-04-22",
    excerpt: "I built a data warehouse to track my own life — sleep, exercise, spending, code commits. Here's what the pipeline looks like.",
    tags: ["data-engineering", "projects"],
    content: `<p>Every few months I get the urge to quantify something about myself. Sleep quality. How much I spend on coffee. How many lines of code I write.</p>
<p>So I built a personal data warehouse. Tiny scale. Just me. But here's the thing: the engineering problems are the same.</p>
<h2>The Architecture</h2>
<pre>Sources → Ingestion → Staging → Warehouse → Visualization</pre>
<p><strong>Sources:</strong> Apple Health exports, CSV bank statements, GitHub API, custom iOS Shortcuts.</p>
<p><strong>Ingestion:</strong> Python scripts triggered by cron. Each script dumps into a raw JSON file.</p>
<p><strong>Staging:</strong> dbt models that clean, deduplicate, and join. Nothing fancy — just solid SQL.</p>
<p><strong>Warehouse:</strong> DuckDB. Yes, DuckDB. A single file. It handles 5 years of personal data in milliseconds.</p>
<p><strong>Visualization:</strong> A Streamlit dashboard. Total time to build: one weekend.</p>
<h2>What I Learned</h2>
<p>Small data teaches you big lessons. Ingesting messy JSON from Apple Health taught me more about schema design than any blog post. dbt models that join step counts to mood ratings taught me about data modeling tradeoffs.</p>
<p>The tools don't need to be big. The thinking does.</p>
<p>This is exactly what I mean in [[perfect-data-stack]] — the simplest thing that works beats a Spark cluster that fails silently. DuckDB here, cron there. Done.</p>`,
  },
  {
    slug: "stream-processing",
    title: "Stream Processing Is Not Batch Processing, Faster",
    date: "2025-03-15",
    excerpt: "The mental model shift required to move from batch to streaming — and why most teams get it wrong.",
    tags: ["data-engineering", "streaming"],
    content: `<p>I've seen too many teams treat stream processing as "batch, but faster." It's not. It's a fundamentally different way of thinking about data, and if you don't make the shift, you'll build fragile systems.</p>
<h2>The Mental Model</h2>
<p><strong>Batch mindset:</strong> I have all the data. I transform it. I produce output.</p>
<p><strong>Stream mindset:</strong> Data arrives continuously. I maintain state. I produce output incrementally.</p>
<p>The difference isn't speed. It's <em>state</em>.</p>
<p>In batch, you can join anything to anything. In streaming, you must decide: what state do I keep, and for how long? This decision ripples through every part of your system.</p>
<h2>The Three Hard Problems</h2>
<ol><li><strong>Out-of-order data.</strong> Events arrive late. Your windowing strategy defines correctness.</li>
<li><strong>Exactly-once semantics.</strong> It's not free. You pay for it in complexity or latency.</li>
<li><strong>Reprocessing.</strong> If your logic changes, can you replay? If not, your stream is a black box.</li></ol>
<h2>The Right Question</h2>
<p>Don't ask "should we use Kafka or Flink?" Ask "does this problem require continuous processing?" Most things don't. Start with batch. Add streaming only when the latency matters.</p>
<p>Your future self will thank you.</p>
<p>This ties back to the broader point in [[perfect-data-stack]] — build the boring thing first. Stream processing is only worth it when the latency actually matters. Most of the time, a batch pipeline (see [[personal-data-warehouse]]) does the job just fine.</p>`,
  },
];
