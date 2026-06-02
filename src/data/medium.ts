export interface MediumPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  url: string;
  publication?: string;
  content: string;
  isMedium: true;
}

export const mediumPosts: MediumPost[] = [
  {
    slug: "first-value-last-value-bigquery",
    title: "Untangling FIRST_VALUE and LAST_VALUE in BigQuery SQL",
    date: "2025-04-28",
    excerpt: "Ever found yourself wrestling with window functions, trying to grab the first and last something within a group of rows?",
    tags: ["big-data-analytics", "sql", "bigquery"],
    url: "https://medium.com/@rxmeez/untangling-first-value-and-last-value-in-bigquery-sql-494cce988f20",
    isMedium: true,
    content: `<div class="mascot-aside">
<img src="/mascot-thinking.svg" alt="" width="67" height="67" class="mascot-img mascot-animated-thinking" />
<span class="mascot-aside-text">Node: I'm still processing window functions. If you think <code>FIRST_VALUE</code> is straightforward, wait until you meet <code>LAST_VALUE</code>'s frame clause.</span>
</div>
<p>Window functions in SQL are powerful — until they're not. <code>FIRST_VALUE</code> and <code>LAST_VALUE</code> are two functions that seem straightforward but often produce unexpected results when you don't fully understand their frame clause behavior.</p>
<h2>The Problem</h2>
<p>Consider this common pattern: you want the first and last value within a partition. You write:</p>
<pre><code class="language-sql">SELECT
  category,
  sale_date,
  amount,
  FIRST_VALUE(amount) OVER (PARTITION BY category ORDER BY sale_date) AS first_sale,
  LAST_VALUE(amount) OVER (PARTITION BY category ORDER BY sale_date) AS last_sale
FROM sales
ORDER BY category, sale_date;</code></pre>
<p>You might expect <code>LAST_VALUE</code> to give you the last row in the partition. It doesn't — unless you specify the window frame correctly.</p>
<h2>The Fix: Explicit Frame Clauses</h2>
<p>The default frame for <code>LAST_VALUE</code> is <code>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code>. This means it only looks from the start to the current row — effectively returning the current row's value, not the partition's last value.</p>
<pre><code class="language-sql">LAST_VALUE(amount) OVER (
  PARTITION BY category
  ORDER BY sale_date
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
) AS last_sale</code></pre>
<h2>Key Takeaways</h2>
<ul>
  <li>Always specify the window frame explicitly when using <code>LAST_VALUE</code></li>
  <li><code>FIRST_VALUE</code> works as expected with the default frame because it starts from <code>UNBOUNDED PRECEDING</code></li>
  <li>Consider using <code>ARRAY_AGG</code> with <code>ORDER BY</code> and <code>LIMIT 1</code> as an alternative pattern in BigQuery</li>
</ul>
<p>This is a common pitfall that catches even experienced SQL developers. The key is understanding that window functions don't "see" the entire partition by default — they see a sliding window defined by the frame clause.</p>
<div class="mascot-aside">
<img src="/mascot.svg" alt="" width="67" height="67" class="mascot-img mascot-animated-default" />
<span class="mascot-aside-text">Node: I'm floating by. I once spent an hour debugging a <code>LAST_VALUE</code> query only to realise the frame clause was the culprit. You're welcome.</span>
</div>
<p class="medium-cta"><a href="https://medium.com/@rxmeez/untangling-first-value-and-last-value-in-bigquery-sql-494cce988f20" target="_blank" rel="noopener noreferrer">Read the full article on Medium ↗</a></p>`,
  },
  {
    slug: "dbt-unit-tests-macros",
    title: "DBT Unit Tests: Expanding to Macros",
    date: "2024-05-28",
    excerpt: "The latest release of dbt version 1.8 brings a game-changing feature: native support for unit testing.",
    tags: ["analytics", "data-engineering", "data", "dbt", "programming"],
    url: "https://towardsdev.com/exploring-dbt-1-8-unit-tests-expanding-to-macros-07a0d089c7f9",
    publication: "Towards Dev",
    isMedium: true,
    content: `<div class="mascot-aside">
<img src="/mascot-surprised.svg" alt="" width="67" height="67" class="mascot-img mascot-animated-surprised" />
<span class="mascot-aside-text">Node: I'm surprised you can unit test dbt macros now. I remember when debugging Jinja felt like reading hieroglyphics.</span>
</div>
<p>dbt 1.8 introduced native unit testing — a feature the community has been asking for. While most of the documentation focuses on testing models, there's a powerful use case that deserves more attention: unit testing macros.</p>
<h2>Why Test Macros?</h2>
<p>Macros are the backbone of reusable logic in dbt. A broken macro can silently corrupt data across dozens of models. Unit tests give you confidence that your Jinja logic is correct before it touches real data.</p>
<h2>A Practical Example</h2>
<p>Here's a macro that normalizes email addresses:</p>
<pre><code class="language-sql">{% macro normalize_email(email_column) %}
  LOWER(TRIM({{ email_column }}))
{% endmacro %}</code></pre>
<p>And the unit test:</p>
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
<h2>Key Patterns</h2>
<ul>
  <li>Test edge cases: nulls, empty strings, special characters</li>
  <li>Test macros in isolation before testing models that use them</li>
  <li>Use <code>given</code> fixtures to mock input data precisely</li>
  <li>Version your test fixtures alongside your macro code</li>
</ul>
<p>Unit testing macros catches logic errors early and makes refactoring safe. If you're on dbt 1.8+, start with your most critical macros — the ones that touch the most models.</p>
<div class="mascot-aside">
<img src="/mascot-thinking.svg" alt="" width="67" height="67" class="mascot-img mascot-animated-thinking" />
<span class="mascot-aside-text">Node: I'm processing this. A macro is just a function. Functions should be tested. This shouldn't be revolutionary, but here we are.</span>
</div>
<p class="medium-cta"><a href="https://towardsdev.com/exploring-dbt-1-8-unit-tests-expanding-to-macros-07a0d089c7f9" target="_blank" rel="noopener noreferrer">Read the full article on Towards Dev ↗</a></p>`,
  },
  {
    slug: "goose-schema-migration",
    title: "Goose – Database Schema Migration Tool",
    date: "2024-05-27",
    excerpt: "Streamlining database changes: unlocking the power of schema migration tools with Goose.",
    tags: ["software-development", "golang", "data", "database"],
    url: "https://medium.com/@rxmeez/streamlining-database-changes-unlocking-the-power-of-schema-migration-tools-with-goose-f6f2e964b19b",
    isMedium: true,
    content: `<div class="mascot-aside">
<img src="/mascot.svg" alt="" width="67" height="67" class="mascot-img mascot-animated-default" />
<span class="mascot-aside-text">Node: I'm floating by. If you're still managing database schemas by hand, Goose will change your life. Or at least your migrations.</span>
</div>
<p>Database migrations are one of those things every project needs but nobody wants to think about. Goose is a minimal, no-fuss migration tool written in Go that deserves more attention.</p>
<h2>Why Goose Over Alternatives?</h2>
<p>Unlike ORM-coupled migration tools, Goose works with plain SQL files. You write <code>.sql</code> files, and Goose applies them in order. No DSL, no framework lock-in.</p>
<h2>Getting Started</h2>
<pre><code class="language-bash">go install github.com/pressly/goose/v3/cmd/goose@latest
goose -dir migrations create add_users_table sql</code></pre>
<p>This creates two files:</p>
<pre><code class="language-sql">-- 20240527000000_add_users_table.up.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 20240527000000_add_users_table.down.sql
DROP TABLE users;</code></pre>
<h2>Key Features</h2>
<ul>
  <li><strong>Embedded migrations:</strong> Use Go's <code>embed</code> package to bundle migrations into your binary</li>
  <li><strong>Transaction safety:</strong> Each migration runs in a transaction by default</li>
  <li><strong>Multi-database:</strong> PostgreSQL, MySQL, SQLite, SQL Server, and more</li>
  <li><strong>Go-based migrations:</strong> For complex logic, write migrations in Go instead of SQL</li>
</ul>
<p>If you're building a Go application that needs database migrations, Goose is worth a look. It's battle-tested, actively maintained, and stays out of your way.</p>
<div class="mascot-aside">
<img src="/mascot-thinking.svg" alt="" width="67" height="67" class="mascot-img mascot-animated-thinking" />
<span class="mascot-aside-text">Node: I'm processing this take. Plain SQL migrations + Go tooling = the pragmatic choice. No ORM magic required.</span>
</div>
<p class="medium-cta"><a href="https://medium.com/@rxmeez/streamlining-database-changes-unlocking-the-power-of-schema-migration-tools-with-goose-f6f2e964b19b" target="_blank" rel="noopener noreferrer">Read the full article on Medium ↗</a></p>`,
  },
  {
    slug: "go-error-handling",
    title: "Understanding Go Error Handling",
    date: "2024-05-25",
    excerpt: "Imagine deploying your Go application only to discover it's riddled with hidden errors.",
    tags: ["go", "developer", "golang", "software-development", "error-handling"],
    url: "https://medium.com/@rxmeez/understanding-go-error-handling-1e6720cc6756",
    isMedium: true,
    content: `<div class="mascot-aside">
<img src="/mascot-surprised.svg" alt="" width="67" height="67" class="mascot-img mascot-animated-surprised" />
<span class="mascot-aside-text">Node: I'm surprised you're reading about Go error handling. Most people just complain about the verbosity and miss the point entirely.</span>
</div>
<p>Go's error handling is one of its most debated features. No exceptions, no try-catch — just values. But once you understand the philosophy, it becomes one of Go's greatest strengths.</p>
<h2>Errors Are Values</h2>
<p>In Go, errors are just values that implement the <code>error</code> interface:</p>
<pre><code class="language-go">type error interface {
  Error() string
}</code></pre>
<p>This simplicity means you can treat errors like any other value: wrap them, chain them, inspect them.</p>
<h2>Common Patterns</h2>
<h3>Sentinel Errors</h3>
<pre><code class="language-go">var ErrNotFound = errors.New("not found")

func FindUser(id string) (*User, error) {
  // ...
  return nil, ErrNotFound
}

// Caller checks:
if errors.Is(err, ErrNotFound) {
  // handle not found
}</code></pre>
<h3>Error Wrapping (Go 1.13+)</h3>
<pre><code class="language-go">func GetConfig() (*Config, error) {
  data, err := os.ReadFile("config.json")
  if err != nil {
    return nil, fmt.Errorf("reading config: %w", err)
  }
  // parse...
}</code></pre>
<h3>Custom Error Types</h3>
<pre><code class="language-go">type ValidationError struct {
  Field string
  Value interface{}
}

func (e *ValidationError) Error() string {
  return fmt.Sprintf("invalid %s: %v", e.Field, e.Value)
}</code></pre>
<h2>Best Practices</h2>
<ul>
  <li>Handle errors at the level where you have context to decide what to do</li>
  <li>Wrap errors with <code>fmt.Errorf("%w", err)</code> to preserve the original</li>
  <li>Use <code>errors.Is</code> and <code>errors.As</code> for type-safe error inspection</li>
  <li>Don't log and return — pick one</li>
  <li>Reserve panics for truly unrecoverable situations</li>
</ul>
<p>Go's explicit error handling forces you to think about failure modes at every step. That's not a bug — it's the feature.</p>
<div class="mascot-aside">
<img src="/mascot.svg" alt="" width="67" height="67" class="mascot-img mascot-animated-default" />
<span class="mascot-aside-text">Node: I'm floating by. I used to miss try-catch. Now I miss it less. Explicit errors make you think. Thinking is good.</span>
</div>
<p class="medium-cta"><a href="https://medium.com/@rxmeez/understanding-go-error-handling-1e6720cc6756" target="_blank" rel="noopener noreferrer">Read the full article on Medium ↗</a></p>`,
  },
];
