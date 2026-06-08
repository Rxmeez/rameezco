interface Env {
  OPENROUTER_API_KEY: string;
}

const ALLOWED_ORIGINS = ["https://rameez.co", "https://rameez-co.pages.dev", "http://localhost:5173", "http://localhost:4173"];

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response("Forbidden", { status: 403 });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad Request: invalid JSON", { status: 400 });
    }

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://rameez.co",
        "X-Title": "Rameez.co - Ask Node",
      },
      body: JSON.stringify(body),
    });

    const contentType = upstream.headers.get("Content-Type") ?? "application/json";

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        ...corsHeaders(origin),
      },
    });
  },
};
