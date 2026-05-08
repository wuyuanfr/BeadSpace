import * as PIXI from "pixi.js";
import type { BeadNode } from "@beadspace/shared";

const BIOME_STYLES: Record<string, { color: number; borderColor: number; label: string }> = {
  src: { color: 0xa8d5ba, borderColor: 0x8bc4a8, label: "Pastel City" },
  lib: { color: 0xa8d5ba, borderColor: 0x8bc4a8, label: "Code Garden" },
  model: { color: 0x9bc7f7, borderColor: 0x7eb5f0, label: "Neural Forest" },
  models: { color: 0x9bc7f7, borderColor: 0x7eb5f0, label: "Neural Forest" },
  data: { color: 0xf3d19c, borderColor: 0xe8c080, label: "Data Desert" },
  dataset: { color: 0xf3d19c, borderColor: 0xe8c080, label: "Data Desert" },
  docs: { color: 0xd7c3f1, borderColor: 0xc0a8e8, label: "Library" },
  test: { color: 0xffb7b2, borderColor: 0xf0a09a, label: "Arena" },
  tests: { color: 0xffb7b2, borderColor: 0xf0a09a, label: "Arena" },
  scripts: { color: 0xf3d19c, borderColor: 0xe8c080, label: "Workshop" },
  config: { color: 0xece7df, borderColor: 0xd5d0c8, label: "Shrine" },
  public: { color: 0xffdce5, borderColor: 0xf0c8d4, label: "Garden" },
  assets: { color: 0xffdce5, borderColor: 0xf0c8d4, label: "Gallery" },
};

const DEPTH_COLORS = [
  { color: 0xa8d5ba, border: 0x8bc4a8 },
  { color: 0x9bc7f7, border: 0x7eb5f0 },
  { color: 0xf3d19c, border: 0xe8c080 },
  { color: 0xd7c3f1, border: 0xc0a8e8 },
  { color: 0xffb7b2, border: 0xf0a09a },
  { color: 0xffdce5, border: 0xf0c8d4 },
];

export function createFolderRegion(node: BeadNode): PIXI.Container {
  const container = new PIXI.Container();
  const nameKey = node.name.toLowerCase();

  const biome = BIOME_STYLES[nameKey];
  const depthStyle = DEPTH_COLORS[node.depth % DEPTH_COLORS.length];

  const bgColor = biome?.color ?? depthStyle.color;
  const borderColor = biome?.borderColor ?? depthStyle.border;

  // Biome background with soft rounded corners
  const bg = new PIXI.Graphics();
  bg.roundRect(node.x, node.y, node.width, node.height, 8);
  bg.fill({ color: bgColor, alpha: 0.2 });
  bg.stroke({ color: borderColor, width: 1.5, alpha: 0.35 });
  container.addChild(bg);

  // Folder label
  if (node.width > 50 && node.height > 24) {
    const displayName = biome
      ? `${node.name} · ${biome.label}`
      : node.name;
    const fontSize = Math.max(9, Math.min(13, node.width / displayName.length * 1.1));
    const label = new PIXI.Text({
      text: displayName,
      style: {
        fontSize,
        fill: 0x8a857d,
        fontFamily: "Nunito, sans-serif",
        fontWeight: "700",
      },
      resolution: window.devicePixelRatio || 1,
    });
    label.x = node.x + 6;
    label.y = node.y + 3;
    container.addChild(label);
  }

  return container;
}
