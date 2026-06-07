export function formatMarkdown(text: string): string {
  if (!text) return "";

  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, "<em>$1</em>");
  html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

  const lines = html.split("\n");
  let inList = false;
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");

    if (isBullet) {
      if (!inList) {
        result.push("<ul>");
        inList = true;
      }
      result.push(`<li>${trimmed.slice(2)}</li>`);
    } else {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      if (trimmed) {
        result.push(`<p>${line}</p>`);
      } else {
        result.push("<br>");
      }
    }
  }

  if (inList) result.push("</ul>");

  return result.join("");
}
