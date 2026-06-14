import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import type { GraphData, GraphNode, NodeType } from "../lib/graph";

interface Props {
  data: GraphData;
  rootId?: string | null;
  compact?: boolean;
  onNodeClick?: (nodeId: string) => void;
  onBgClick?: () => void;
  highlightedId?: string | null;
}

function css() {
  const s = getComputedStyle(document.documentElement);
  return {
    fg: s.getPropertyValue("--fg").trim() || "#000",
    muted: s.getPropertyValue("--muted").trim() || "#888",
    bg: s.getPropertyValue("--bg").trim() || "#fff",
    fontMono: s.getPropertyValue("--font-mono").trim() || `"JetBrains Mono", monospace`,
    graphPost: s.getPropertyValue("--graph-post").trim() || "#d4d4d0",
    graphTag: s.getPropertyValue("--graph-tag").trim() || "#8fbc8f",
    graphProject: s.getPropertyValue("--graph-project").trim() || "#ff6b2b",
    graphNote: s.getPropertyValue("--graph-note").trim() || "#5b9bd5",
  };
}

function hexToRgba(hex: string, a: number): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return hex;
  return `rgba(${Number.parseInt(m[1], 16)},${Number.parseInt(m[2], 16)},${Number.parseInt(m[3], 16)},${a})`;
}

function trunc(str: string, n: number) {
  return str.length > n ? `${str.slice(0, n - 1)}\u2026` : str;
}

function nodeColor(type: NodeType, c: ReturnType<typeof css>): string {
  switch (type) {
    case "post": return c.graphPost;
    case "tag": return c.graphTag;
    case "project": return c.graphProject;
    case "note": return c.graphNote;
    default: return c.fg;
  }
}

function getRadius(node: GraphNode, compact?: boolean, width?: number): number {
  const isTag = node.type === "tag";
  const baseRadius = isTag ? 3 : 4;
  const maxRadius = compact ? (isTag ? 6 : 8) : (isTag ? 6 : 12);
  const radius = Math.min(baseRadius + Math.sqrt(node.linkCount || 0) * 2, maxRadius);
  return width && width < 520 ? radius * 0.85 : radius;
}

type SimNode = GraphNode & d3.SimulationNodeDatum;

export default function Graph({ data, compact, onNodeClick, onBgClick, highlightedId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onNodeClickRef = useRef(onNodeClick);
  const onBgClickRef = useRef(onBgClick);
  const drawRef = useRef<(() => void) | null>(null);
  const simRef = useRef<d3.Simulation<SimNode, undefined> | null>(null);

  const [dims, setDims] = useState({ w: 800, h: 520 });
  const [themeKey, setThemeKey] = useState(0);

  const hoveredRef = useRef<string | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const adjacencyRef = useRef<Map<string, Set<string>>>(new Map());
  const highlightedIdRef = useRef(highlightedId);
  const interactionRef = useRef<{
    type: "drag" | "pan" | null;
    node: SimNode | null;
    startX: number;
    startY: number;
    startTime: number;
    panStartTransform: d3.ZoomTransform;
  }>({
    type: null,
    node: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    panStartTransform: d3.zoomIdentity,
  });

  onNodeClickRef.current = onNodeClick;
  onBgClickRef.current = onBgClick;
  highlightedIdRef.current = highlightedId;

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeKey((k) => k + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const adj = new Map<string, Set<string>>();
    for (const n of data.nodes) adj.set(n.id, new Set());
    for (const e of data.edges) {
      adj.get(e.from)?.add(e.to);
      adj.get(e.to)?.add(e.from);
    }
    adjacencyRef.current = adj;
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const cvs = canvas;

    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = dims.w;
    const height = dims.h;

    cvs.width = width * dpr;
    cvs.height = height * dpr;
    cvs.style.width = `${width}px`;
    cvs.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    hoveredRef.current = null;
    transformRef.current = d3.zoomIdentity;

    const simNodes = data.nodes.map((n) => ({ ...n })) as SimNode[];
    const simLinks = data.edges.map((e) => ({
      source: e.from,
      target: e.to,
    })) as d3.SimulationLinkDatum<SimNode>[];

    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        "link",
        d3.forceLink(simLinks).id((d) => (d as SimNode).id).distance(80).strength(0.5),
      )
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d) => getRadius(d as GraphNode, compact, dims.w) + 4))
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    simRef.current = simulation;

    function screenToGraph(mx: number, my: number): [number, number] {
      const t = transformRef.current;
      return [(mx - t.x) / t.k, (my - t.y) / t.k];
    }

    function getNodeAtPoint(mx: number, my: number): GraphNode | null {
      const [gx, gy] = screenToGraph(mx, my);
      let closest: GraphNode | null = null;
      let closestDist = Number.POSITIVE_INFINITY;

      for (const node of simNodes) {
        const nx = node.x ?? 0;
        const ny = node.y ?? 0;
        const dx = gx - nx;
        const dy = gy - ny;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = getRadius(node, compact, dims.w) + 6;
        if (dist < radius && dist < closestDist) {
          closest = node;
          closestDist = dist;
        }
      }
      return closest;
    }

    function draw() {
      if (!ctx) return;
      const c = css();
      const t = transformRef.current;
      const activeId = highlightedIdRef.current ?? hoveredRef.current;

      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = c.bg;
      ctx.fillRect(0, 0, width, height);

      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      for (const edge of simLinks) {
        const source = edge.source as SimNode;
        const target = edge.target as SimNode;
        const sx = source.x ?? 0;
        const sy = source.y ?? 0;
        const tx = target.x ?? 0;
        const ty = target.y ?? 0;

        let isConnected = false;
        if (activeId) {
          if (source.id === activeId || target.id === activeId) isConnected = true;
        }

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = hexToRgba(c.muted, isConnected ? 0.5 : 0.12);
        ctx.lineWidth = 1.2 / t.k;
        ctx.stroke();
      }

      for (const node of simNodes) {
        const nx = node.x ?? 0;
        const ny = node.y ?? 0;
        const hov = hoveredRef.current === node.id;
        const isHighlighted = highlightedIdRef.current === node.id;
        const color = nodeColor(node.type as NodeType, c);
        const baseRadius = getRadius(node, compact, dims.w);
        const radius = baseRadius * (hov || isHighlighted ? 1.5 : 1);

        let isDimmed = false;
        if (activeId && activeId !== node.id) {
          const neighbors = adjacencyRef.current.get(activeId);
          if (!neighbors || !neighbors.has(node.id)) {
            isDimmed = true;
          }
        }

        ctx.globalAlpha = isDimmed ? 0.03 : hov || isHighlighted ? 0.25 : 0.12;
        ctx.beginPath();
        ctx.arc(nx, ny, radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.globalAlpha = isDimmed ? 0.06 : hov || isHighlighted ? 0.6 : 0.35;
        ctx.beginPath();
        ctx.arc(nx, ny, radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.globalAlpha = isDimmed ? 0.15 : 1.0;
        ctx.beginPath();
        ctx.arc(nx, ny, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (hov || isHighlighted) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5 / t.k;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(nx, ny, radius + 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.globalAlpha = 1.0;

        if (hov || isHighlighted) {
          const label = trunc(node.label, 30);
          const fontSize = dims.w < 520 ? 10 : 11;
          ctx.font = `${fontSize}px ${c.fontMono}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";

          const textMetrics = ctx.measureText(label);
          const textWidth = textMetrics.width;
          const padding = 4;
          const labelY = ny + radius + 10;
          const bgX = nx - textWidth / 2 - padding;
          const bgY = labelY - 2;
          const bgW = textWidth + padding * 2;
          const bgH = 13 + padding;

          ctx.fillStyle = hexToRgba(c.bg, 0.85);
          ctx.beginPath();
          ctx.moveTo(bgX + 3, bgY);
          ctx.lineTo(bgX + bgW - 3, bgY);
          ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + 3);
          ctx.lineTo(bgX + bgW, bgY + bgH - 3);
          ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - 3, bgY + bgH);
          ctx.lineTo(bgX + 3, bgY + bgH);
          ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - 3);
          ctx.lineTo(bgX, bgY + 3);
          ctx.quadraticCurveTo(bgX, bgY, bgX + 3, bgY);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = c.fg;
          ctx.fillText(label, nx, labelY);
        }
      }

      ctx.restore();
    }

    drawRef.current = draw;

    function handleMouseMove(event: MouseEvent) {
      const rect = cvs.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const ix = interactionRef.current;

      if (ix.type === "drag" && ix.node) {
        const [gx, gy] = screenToGraph(mx, my);
        ix.node.fx = gx;
        ix.node.fy = gy;
        simulation.alpha(0.3).restart();
      } else if (ix.type === "pan") {
        const dx = mx - ix.startX;
        const dy = my - ix.startY;
        transformRef.current = d3.zoomIdentity
          .translate(ix.panStartTransform.x + dx, ix.panStartTransform.y + dy)
          .scale(ix.panStartTransform.k);
        draw();
      } else {
        const node = getNodeAtPoint(mx, my);
        const prev = hoveredRef.current;
        const next = node ? node.id : null;
        if (prev !== next) {
          hoveredRef.current = next;
          cvs.style.cursor = next ? "pointer" : "grab";
          draw();
        }
      }
    }

    function handleMouseDown(event: MouseEvent) {
      const rect = cvs.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const node = getNodeAtPoint(mx, my);

      interactionRef.current = {
        type: node ? "drag" : "pan",
        node: node as SimNode | null,
        startX: mx,
        startY: my,
        startTime: Date.now(),
        panStartTransform: transformRef.current,
      };

      cvs.style.cursor = "grabbing";
    }

    function handleMouseUp(event: MouseEvent) {
      const rect = cvs.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const ix = interactionRef.current;

      if (ix.type === "drag" && ix.node) {
        const dx = mx - ix.startX;
        const dy = my - ix.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = Date.now() - ix.startTime;

        ix.node.fx = null;
        ix.node.fy = null;
        simulation.alphaTarget(0);
        cvs.style.cursor = hoveredRef.current ? "pointer" : "grab";

        if (dist < 5 && duration < 300) {
          onNodeClickRef.current?.(ix.node.id);
        }
      } else if (ix.type === "pan") {
        const dx = mx - ix.startX;
        const dy = my - ix.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = Date.now() - ix.startTime;

        cvs.style.cursor = "grab";

        if (dist < 5 && duration < 300) {
          onBgClickRef.current?.();
        }
      }

      interactionRef.current = {
        type: null,
        node: null,
        startX: 0,
        startY: 0,
        startTime: 0,
        panStartTransform: d3.zoomIdentity,
      };
    }

    function handleMouseLeave() {
      const ix = interactionRef.current;
      if (ix.type === "drag" && ix.node) {
        ix.node.fx = null;
        ix.node.fy = null;
        simulation.alphaTarget(0);
      }
      interactionRef.current = {
        type: null,
        node: null,
        startX: 0,
        startY: 0,
        startTime: 0,
        panStartTransform: d3.zoomIdentity,
      };
      hoveredRef.current = null;
      cvs.style.cursor = "grab";
      draw();
    }

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = cvs.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;

      const t = transformRef.current;
      const scaleFactor = event.deltaY < 0 ? 1.15 : 0.87;
      const newK = Math.max(0.3, Math.min(4, t.k * scaleFactor));

      const newX = mx - (mx - t.x) * (newK / t.k);
      const newY = my - (my - t.y) * (newK / t.k);

      transformRef.current = d3.zoomIdentity.translate(newX, newY).scale(newK);
      draw();
    }

    function handleTouchStart(event: TouchEvent) {
      event.preventDefault();
      const touch = event.touches[0];
      const rect = cvs.getBoundingClientRect();
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
      const node = getNodeAtPoint(mx, my);

      interactionRef.current = {
        type: node ? "drag" : "pan",
        node: node as SimNode | null,
        startX: mx,
        startY: my,
        startTime: Date.now(),
        panStartTransform: transformRef.current,
      };
    }

    function handleTouchMove(event: TouchEvent) {
      event.preventDefault();
      const touch = event.touches[0];
      const rect = cvs.getBoundingClientRect();
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
      const ix = interactionRef.current;

      if (ix.type === "drag" && ix.node) {
        const [gx, gy] = screenToGraph(mx, my);
        ix.node.fx = gx;
        ix.node.fy = gy;
        simulation.alpha(0.3).restart();
      } else if (ix.type === "pan") {
        const dx = mx - ix.startX;
        const dy = my - ix.startY;
        transformRef.current = d3.zoomIdentity
          .translate(ix.panStartTransform.x + dx, ix.panStartTransform.y + dy)
          .scale(ix.panStartTransform.k);
        draw();
      }
    }

    function handleTouchEnd(event: TouchEvent) {
      event.preventDefault();
      const touch = event.changedTouches[0];
      const rect = cvs.getBoundingClientRect();
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
      const ix = interactionRef.current;

      if (ix.type === "drag" && ix.node) {
        const dx = mx - ix.startX;
        const dy = my - ix.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = Date.now() - ix.startTime;

        ix.node.fx = null;
        ix.node.fy = null;
        simulation.alphaTarget(0);

        if (dist < 10 && duration < 400) {
          onNodeClickRef.current?.(ix.node.id);
        }
      } else if (ix.type === "pan") {
        const dx = mx - ix.startX;
        const dy = my - ix.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = Date.now() - ix.startTime;

        if (dist < 10 && duration < 400) {
          onBgClickRef.current?.();
        }
      }

      interactionRef.current = {
        type: null,
        node: null,
        startX: 0,
        startY: 0,
        startTime: 0,
        panStartTransform: d3.zoomIdentity,
      };
    }

    cvs.addEventListener("mousemove", handleMouseMove);
    cvs.addEventListener("mousedown", handleMouseDown);
    cvs.addEventListener("mouseup", handleMouseUp);
    cvs.addEventListener("mouseleave", handleMouseLeave);
    cvs.addEventListener("wheel", handleWheel, { passive: false });
    cvs.addEventListener("touchstart", handleTouchStart, { passive: false });
    cvs.addEventListener("touchmove", handleTouchMove, { passive: false });
    cvs.addEventListener("touchend", handleTouchEnd, { passive: false });

    simulation.on("tick", draw);
    simulation.tick(30);
    draw();

    return () => {
      cvs.removeEventListener("mousemove", handleMouseMove);
      cvs.removeEventListener("mousedown", handleMouseDown);
      cvs.removeEventListener("mouseup", handleMouseUp);
      cvs.removeEventListener("mouseleave", handleMouseLeave);
      cvs.removeEventListener("wheel", handleWheel);
      cvs.removeEventListener("touchstart", handleTouchStart);
      cvs.removeEventListener("touchmove", handleTouchMove);
      cvs.removeEventListener("touchend", handleTouchEnd);
      simulation.stop();
      drawRef.current = null;
    };
  }, [dims.w, dims.h, data, compact]);

  useEffect(() => {
    drawRef.current?.();
  }, [themeKey, highlightedId]);

  const handleReset = useCallback(() => {
    transformRef.current = d3.zoomIdentity;
    drawRef.current?.();
    onBgClickRef.current?.();
  }, []);

  return (
    <div className="graph-wrapper">
      <div className="graph-toolbar">
        <span className="graph-toolbar-id">node@rameez.co — graph --explore</span>
        <div className="graph-toolbar-right">
          <span className="graph-hint">
            <span className="legend-dot legend-dot-post" /> posts
            <span className="graph-hint-sep">·</span>
            <span className="legend-dot legend-dot-note" /> notes
            <span className="graph-hint-sep">·</span>
            <span className="legend-dot legend-dot-tag" /> tags
            <span className="graph-hint-sep">·</span>
            <span className="legend-dot legend-dot-project" /> projects
          </span>
          <span className="graph-stats">
            {data.nodes.length} nodes &middot; {data.edges.length} links
          </span>
          <button className="graph-btn" onClick={handleReset} type="button">
            reset
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className={compact ? "graph-svg-container graph-svg-compact" : "graph-svg-container"}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", cursor: "grab" }}
        />
      </div>
    </div>
  );
}
