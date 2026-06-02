export interface Note {
  slug: string;
  title: string;
  date: string;
  content: string;
  tags: string[];
}

export const notes: Note[] = [
  {
    slug: "goose-migrations-quickref",
    title: "Goose — Database Migrations Quick Reference",
    date: "2025-06-15",
    tags: ["go", "database", "migrations", "tooling"],
    content: `<p>Goose is a Go migration tool that uses plain SQL. No ORM lock-in, no DSL.</p>
<h3>Install & Create</h3>
<pre><code class="language-bash">go install github.com/pressly/goose/v3/cmd/goose@latest
goose -dir migrations create add_users_table sql</code></pre>
<h3>Key Patterns</h3>
<ul>
  <li>Each migration gets <code>.up.sql</code> and <code>.down.sql</code> files</li>
  <li>Runs in transactions by default</li>
  <li>Supports embedding migrations into Go binaries</li>
  <li>Multi-database: PostgreSQL, MySQL, SQLite, SQL Server</li>
</ul>
<p>I use Goose for all Go services. Plain SQL + version control beats ORM magic.</p>`,
  },
  {
    slug: "dbt-unit-test-macros",
    title: "Unit Testing dbt Macros",
    date: "2025-06-15",
    tags: ["dbt", "testing", "data-engineering", "sql"],
    content: `<p>dbt 1.8 added native unit tests. Most docs focus on models, but testing macros is where the real value is.</p>
<h3>Why Test Macros?</h3>
<p>A broken macro silently corrupts data across dozens of models. Unit tests catch logic errors before they touch real data.</p>
<h3>Example</h3>
<pre><code class="language-yaml">unit_tests:
  - name: test_normalize_email
    model: stg_users
    given:
      - input: ref('stg_users')
        rows:
          - {email: '  User@Example.COM  '}
    expect:
      rows:
        - {email: 'user@example.com'}</code></pre>
<h3>Patterns</h3>
<ul>
  <li>Test edge cases: nulls, empty strings, special characters</li>
  <li>Test macros in isolation before testing models</li>
  <li>Mock input data with <code>given</code> fixtures</li>
  <li>Version test fixtures alongside macro code</li>
</ul>
<p>Start with your most critical macros — the ones that touch the most models.</p>`,
  },
];
