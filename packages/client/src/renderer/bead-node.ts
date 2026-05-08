import * as PIXI from "pixi.js";
import type { BeadNode } from "@beadspace/shared";

const PASTEL_MAP: Record<string, number> = {
  typescript: 0x9bc7f7,
  javascript: 0xf3d19c,
  python: 0xa8d5ba,
  rust: 0xffb7b2,
  go: 0x9bc7f7,
  java: 0xf3d19c,
  csharp: 0xa8d5ba,
  cpp: 0xffb7b2,
  c: 0xd7c3f1,
  ruby: 0xffb7b2,
  php: 0xd7c3f1,
  html: 0xffb7b2,
  css: 0xd7c3f1,
  scss: 0xffdce5,
  json: 0xece7df,
  yaml: 0xf3d19c,
  markdown: 0x9bc7f7,
  dockerfile: 0x9bc7f7,
  shell: 0xa8d5ba,
  sql: 0xf3d19c,
  unknown: 0xece7df,
};

export function getPastelColor(language?: string): number {
  return PASTEL_MAP[language ?? "unknown"] ?? PASTEL_MAP.unknown;
}

export function getPastelHex(language?: string): string {
  const c = getPastelColor(language);
  return "#" + c.toString(16).padStart(6, "0");
}

interface BeadResult {
  container: PIXI.Container;
  label: PIXI.Text | null;
  brightnessOverlay: PIXI.Graphics;
}

export function createBeadNode(node: BeadNode): BeadResult {
  const container = new PIXI.Container();
  const color = getPastelColor(node.language);

  const isReadme =
    node.name.toLowerCase() === "readme.md" ||
    node.name.toLowerCase() === "readme";

  // Bead dimensions — circular within the treemap cell
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const radius = Math.max(4, Math.min(node.width, node.height) / 2 - 2);

  // Bead base circle (soft plastic look)
  const bead = new PIXI.Graphics();
  bead.circle(cx, cy, radius);
  bead.fill(isReadme ? 0xfff1b8 : color);
  container.addChild(bead);

  // Inner shadow (bottom) for 3D depth
  if (radius > 6) {
    const innerShadow = new PIXI.Graphics();
    innerShadow.circle(cx, cy + radius * 0.1, radius * 0.92);
    innerShadow.fill({ color: 0x000000, alpha: 0.06 });
    container.addChild(innerShadow);
  }

  // Top-left highlight (plastic reflection)
  if (radius > 5) {
    const highlight = new PIXI.Graphics();
    highlight.circle(cx - radius * 0.25, cy - radius * 0.25, radius * 0.35);
    highlight.fill({ color: 0xffffff, alpha: 0.3 });
    container.addChild(highlight);

    // Secondary smaller shine
    const shine2 = new PIXI.Graphics();
    shine2.circle(cx - radius * 0.15, cy - radius * 0.35, radius * 0.12);
    shine2.fill({ color: 0xffffff, alpha: 0.45 });
    container.addChild(shine2);
  }

  // Center hole (perler bead signature)
  if (radius > 8) {
    const hole = new PIXI.Graphics();
    hole.circle(cx, cy, radius * 0.15);
    hole.fill({ color: 0x000000, alpha: 0.05 });
    container.addChild(hole);
  }

  // Brightness/activity overlay
  const brightnessOverlay = new PIXI.Graphics();
  brightnessOverlay.circle(cx, cy, radius);
  const dimAmount = Math.max(0, 0.3 - node.brightness * 0.3);
  brightnessOverlay.fill({ color: 0xf9f8f4, alpha: dimAmount });
  container.addChild(brightnessOverlay);

  // Git sparkle for recently active files
  if (node.gitRecentActivity && node.gitRecentActivity > 2 && radius > 8) {
    const sparkle = new PIXI.Graphics();
    sparkle.circle(cx + radius * 0.5, cy - radius * 0.5, 2.5);
    sparkle.fill({ color: 0xfff1b8, alpha: 0.9 });
    container.addChild(sparkle);
  }

  // README landmark: golden glow + star
  if (isReadme && radius > 10) {
    const glow = new PIXI.Graphics();
    glow.circle(cx, cy, radius + 4);
    glow.fill({ color: 0xfff1b8, alpha: 0.25 });
    container.addChildAt(glow, 0);

    const star = new PIXI.Text({
      text: "★",
      style: { fontSize: Math.min(16, radius), fill: 0xd4a843 },
      resolution: window.devicePixelRatio || 1,
    });
    star.x = cx - star.width / 2;
    star.y = cy - star.height / 2;
    container.addChild(star);
  }

  // File name label (positioned outside/above the bead, added to separate layer)
  let label: PIXI.Text | null = null;
  if (radius > 16 && !isReadme) {
    const maxChars = Math.floor((radius * 2) / 7);
    const displayName =
      node.name.length > maxChars
        ? node.name.slice(0, maxChars - 1) + "…"
        : node.name;
    label = new PIXI.Text({
      text: displayName,
      style: {
        fontSize: Math.max(8, Math.min(11, radius * 0.35)),
        fill: 0x3d3a35,
        fontFamily: "Nunito, sans-serif",
        fontWeight: "600",
      },
      resolution: window.devicePixelRatio || 1,
    });
    label.x = cx - label.width / 2;
    label.y = cy + radius + 3;
    label.alpha = 0.7;
  }

  container.x = 0;
  container.y = 0;

  return { container, label, brightnessOverlay };
}
