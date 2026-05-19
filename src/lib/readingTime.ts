export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

export function readingTimeMinutes(html: string): number {
  const text = stripHtml(html);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
