import * as PIXI from "pixi.js";
import type { BeadNode } from "@beadspace/shared";

export function createBeadNode(node: BeadNode): PIXI.Container {
  const container = new PIXI.Container();
  const color = parseInt(node.color.replace("#", ""), 16);
  const padding = 1;

  const isReadme =
    node.name.toLowerCase() === "readme.md" ||
    node.name.toLowerCase() === "readme";
  const isDockerfile = node.name.toLowerCase() === "dockerfile";

  // Main bead
  const bead = new PIXI.Graphics();
  const beadX = node.x + padding;
  const beadY = node.y + padding;
  const beadW = Math.max(4, node.width - padding * 2);
  const beadH = Math.max(4, node.height - padding * 2);

  bead.roundRect(beadX, beadY, beadW, beadH, 2);
  bead.fill(isReadme ? 0xffd700 : color);

  // Bead highlight (top-left shine for 3D puzzle feel)
  if (beadW > 8 && beadH > 8) {
    const shine = new PIXI.Graphics();
    shine.roundRect(beadX + 1, beadY + 1, beadW * 0.4, beadH * 0.3, 1);
    shine.fill({ color: 0xffffff, alpha: 0.12 });
    container.addChild(shine);
  }

  // Shadow (bottom-right for depth)
  if (beadW > 8 && beadH > 8) {
    const shadow = new PIXI.Graphics();
    shadow.roundRect(
      beadX + beadW * 0.5,
      beadY + beadH * 0.6,
      beadW * 0.48,
      beadH * 0.38,
      1
    );
    shadow.fill({ color: 0x000000, alpha: 0.15 });
    container.addChild(shadow);
  }

  container.addChild(bead);

  // Brightness overlay (dimmer = less active)
  const dimOverlay = new PIXI.Graphics();
  dimOverlay.roundRect(beadX, beadY, beadW, beadH, 2);
  dimOverlay.fill({ color: 0x000000, alpha: 1 - node.brightness });
  container.addChild(dimOverlay);

  // Special border for Dockerfile
  if (isDockerfile) {
    const border = new PIXI.Graphics();
    border.roundRect(beadX - 1, beadY - 1, beadW + 2, beadH + 2, 3);
    border.stroke({ color: 0x0db7ed, width: 2, alpha: 0.8 });
    container.addChild(border);
  }

  // Star for README
  if (isReadme && beadW > 16 && beadH > 16) {
    const star = new PIXI.Text({
      text: "★",
      style: { fontSize: Math.min(14, beadW * 0.5), fill: 0xffd700 },
      resolution: window.devicePixelRatio || 1,
    });
    star.x = beadX + beadW / 2 - star.width / 2;
    star.y = beadY + beadH / 2 - star.height / 2;
    container.addChild(star);
  }

  // File name label (only if bead is large enough)
  if (beadW > 35 && beadH > 18 && !isReadme) {
    const fontSize = Math.max(9, Math.min(12, beadH * 0.25));
    const maxChars = Math.floor(beadW / (fontSize * 0.65));
    const displayName =
      node.name.length > maxChars
        ? node.name.slice(0, maxChars - 2) + ".."
        : node.name;
    const label = new PIXI.Text({
      text: displayName,
      style: {
        fontSize,
        fill: 0xffffff,
        fontFamily: "monospace",
      },
      resolution: window.devicePixelRatio || 1,
    });
    label.x = beadX + 3;
    label.y = beadY + 3;
    label.alpha = 0.8;
    container.addChild(label);
  }

  container.x = 0;
  container.y = 0;

  return container;
}
