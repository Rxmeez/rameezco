export interface SearchResult {
  title: string;
  type: string;
  score: number;
}

function proxyUrlOrThrow(): string {
  const proxyUrl = import.meta.env.VITE_NODE_PROXY_URL;
  if (!proxyUrl) {
    throw new Error(
      "VITE_NODE_PROXY_URL is not set. Deploy the Cloudflare Worker and add its URL to your environment.",
    );
  }
  return proxyUrl;
}

// Semantic search over the site's knowledge base (worker mode=search)
export async function searchNode(query: string): Promise<SearchResult[]> {
  const response = await fetch(proxyUrlOrThrow(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "search", query }),
  });
  if (!response.ok) throw new Error(`Node search error ${response.status}`);
  const data = (await response.json()) as { results?: SearchResult[] };
  return data.results ?? [];
}

// One cheeky line from Node about a Terminal Typist result (worker mode=taunt)
export async function tauntNode(score: number, wpm: number): Promise<string | null> {
  const response = await fetch(proxyUrlOrThrow(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "taunt", score, wpm }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { taunt?: string | null };
  return data.taunt ?? null;
}

export async function askNode(
  question: string,
  onToken?: (token: string) => void,
  pageContext?: { title: string; content: string; type: string } | null,
  conversationHistory?: { role: "user" | "node"; text: string }[],
): Promise<{ answer: string; sources: string[] }> {
  const proxyUrl = import.meta.env.VITE_NODE_PROXY_URL;
  if (!proxyUrl) {
    throw new Error(
      "VITE_NODE_PROXY_URL is not set. Deploy the Cloudflare Worker and add its URL to your environment.",
    );
  }

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      history: conversationHistory,
      pageContext,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Node error ${response.status}: ${errorText}`);
  }

  const sources = JSON.parse(
    response.headers.get("X-Node-Sources") ?? "[]",
  ) as string[];

  if (typeof onToken !== "function") {
    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const answer =
      data.choices?.[0]?.message?.content?.trim() ?? "I'm not sure about that one.";
    return { answer, sources };
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Failed to get response reader for streaming.");

  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let tokenCount = 0;

  function tryParseSseLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) return;
    const dataStr = trimmed.slice(6);
    if (dataStr === "[DONE]") return;
    try {
      const data = JSON.parse(dataStr) as { choices?: { delta?: { content?: string } }[] };
      const delta = data.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta) {
        tokenCount++;
        answer += delta;
        onToken?.(delta);
      }
    } catch {}
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) tryParseSseLine(line);
  }

  for (const line of buffer.split("\n")) tryParseSseLine(line);

  if (tokenCount === 0 && buffer) {
    try {
      const data = JSON.parse(buffer) as { choices?: { message?: { content?: string } }[] };
      const content = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (content) {
        answer = content;
        onToken(content);
      }
    } catch {}
  }

  return { answer: answer.trim() || "I'm not sure about that one.", sources };
}
