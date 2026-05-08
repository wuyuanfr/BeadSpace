import * as PIXI from "pixi.js";
import type { BeadNode } from "@beadspace/shared";

function hslToHex(h: number, s: number, l: number): number {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

export function createFolderRegion(node: BeadNode): PIXI.Container {
  const container = new PIXI.Container();

  const hue = (node.depth * 55 + 220) % 360;
  const bgColor = hslToHex(hue, 25, 15);
  const borderColor = hslToHex(hue, 35, 30);

  const bg = new PIXI.Graphics();
  bg.roundRect(node.x, node.y, node.width, node.height, 4);
  bg.fill({ color: bgColor, alpha: 0.6 });
  bg.stroke({ color: borderColor, width: 1, alpha: 0.4 });
  container.addChild(bg);

  if (node.width > 40 && node.height > 20) {
    const label = new PIXI.Text({
      text: node.name,
      style: {
        fontSize: Math.max(10, Math.min(14, node.width / node.name.length * 1.2)),
        fill: 0xaaaacc,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
      resolution: window.devicePixelRatio || 1,
    });
    label.x = node.x + 4;
    label.y = node.y + 2;
    container.addChild(label);
  }

  return container;
}
