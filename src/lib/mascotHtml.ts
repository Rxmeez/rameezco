import {
  mascotDefaultSvgStr,
  mascotSurprisedSvgStr,
  mascotThinkingSvgStr,
} from "../components/MascotSvg";

const svgMap: Record<string, string> = {
  "/mascot.svg": mascotDefaultSvgStr,
  "/mascot-surprised.svg": mascotSurprisedSvgStr,
  "/mascot-thinking.svg": mascotThinkingSvgStr,
};

function extractAttr(tag: string, attr: string): string | undefined {
  const m = tag.match(new RegExp(`${attr}=["']?([^"'\s>]+)["']?`));
  return m?.[1];
}

function buildSvg(imgTag: string, svgInner: string): string {
  const width = extractAttr(imgTag, "width") ?? "48";
  const height = extractAttr(imgTag, "height") ?? "48";
  const cls = (extractAttr(imgTag, "class") ?? "").trim();
  const style = extractAttr(imgTag, "style");
  const inlineStyle = style ? `${style};` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}" class="${cls}" style="${inlineStyle}color:var(--fg)">${svgInner}</svg>`;
}

export function replaceMascotImages(html: string): string {
  return html.replace(
    /<img[^>]*src=["']\/mascot[^"']*\.svg["'][^>]*>/g,
    (match) => {
      const src = extractAttr(match, "src");
      const svgInner = src ? svgMap[src] : undefined;
      if (!svgInner) return match;
      return buildSvg(match, svgInner);
    },
  );
}
