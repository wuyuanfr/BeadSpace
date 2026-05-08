import * as PIXI from "pixi.js";
import type { WorkspaceGraph, BeadNode } from "@beadspace/shared";
import { createFolderRegion } from "./folder-region.js";
import { createBeadNode } from "./bead-node.js";
import { setupViewport } from "../camera/viewport.js";
import { showTooltip, hideTooltip } from "./tooltip.js";
import { showDetailCard } from "../ui/detail-card.js";
import { createAmbientParticles } from "./particles.js";

export class BeadSpaceApp {
  private app!: PIXI.Application;
  private world!: PIXI.Container;
  private folderLayer!: PIXI.Container;
  private beadLayer!: PIXI.Container;
  private labelLayer!: PIXI.Container;
  private particleLayer!: PIXI.Container;

  async init(container: HTMLElement): Promise<void> {
    this.app = new PIXI.Application();
    await this.app.init({
      resizeTo: container,
      backgroundColor: 0xf9f8f4,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    container.appendChild(this.app.canvas);

    this.world = new PIXI.Container();
    this.folderLayer = new PIXI.Container();
    this.beadLayer = new PIXI.Container();
    this.labelLayer = new PIXI.Container();
    this.particleLayer = new PIXI.Container();

    this.world.addChild(this.folderLayer);
    this.world.addChild(this.beadLayer);
    this.world.addChild(this.labelLayer);
    this.world.addChild(this.particleLayer);

    this.app.stage.addChild(this.world);
    this.app.stage.eventMode = "static";

    setupViewport(this.app, this.world);
  }

  resize(): void {
    this.app.resize();
  }

  toggleLayer(layer: string, visible: boolean): void {
    if (layer === "folders") this.folderLayer.visible = visible;
    if (layer === "labels") this.labelLayer.visible = visible;
    if (layer === "git") {
      this.beadLayer.children.forEach((child) => {
        const beadData = (child as any)._beadData as BeadNode | undefined;
        if (beadData) {
          const overlay = (child as any)._brightnessOverlay as PIXI.Graphics | undefined;
          if (overlay) overlay.visible = visible;
        }
      });
    }
  }

  renderGraph(graph: WorkspaceGraph): void {
    this.folderLayer.removeChildren();
    this.beadLayer.removeChildren();
    this.labelLayer.removeChildren();
    this.particleLayer.removeChildren();

    const folders = graph.nodes.filter((n) => n.type === "folder");
    const files = graph.nodes.filter((n) => n.type === "file");

    // Folder biome regions
    for (const folder of folders) {
      const region = createFolderRegion(folder);
      this.folderLayer.addChild(region);
    }

    // File beads with staggered entrance
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { container: bead, label, brightnessOverlay } = createBeadNode(file);

      bead.eventMode = "static";
      bead.cursor = "pointer";
      (bead as any)._beadData = file;
      (bead as any)._brightnessOverlay = brightnessOverlay;

      bead.on("pointerover", (e: PIXI.FederatedPointerEvent) => {
        showTooltip(file, e.globalX, e.globalY);
        bead.scale.set(1.08);
      });
      bead.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
        showTooltip(file, e.globalX, e.globalY);
      });
      bead.on("pointerout", () => {
        hideTooltip();
        bead.scale.set(1.0);
      });
      bead.on("pointertap", () => showDetailCard(file));

      if (label) {
        this.labelLayer.addChild(label);
      }

      // Entrance: beads fall in from above
      const targetY = bead.y;
      bead.y = targetY - 30;
      bead.alpha = 0;
      const delay = Math.min(i * 8, 800);
      setTimeout(() => animateIn(bead, targetY), delay);

      this.beadLayer.addChild(bead);
    }

    // Ambient floating particles
    const particles = createAmbientParticles(2000, 2000);
    this.particleLayer.addChild(particles);
    this.app.ticker.add(() => {
      updateParticles(particles);
    });

    // Breathing animation for beads
    this.app.ticker.add(() => {
      const t = Date.now() * 0.001;
      for (let i = 0; i < this.beadLayer.children.length; i++) {
        const child = this.beadLayer.children[i];
        const data = (child as any)._beadData as BeadNode | undefined;
        if (data && data.gitRecentActivity && data.gitRecentActivity > 0) {
          const breathe = 1 + Math.sin(t * 1.5 + i * 0.3) * 0.01;
          if (child.scale.x === 1.0 || child.scale.x === (child as any)._lastBreathe) {
            child.scale.set(breathe);
            (child as any)._lastBreathe = breathe;
          }
        }
      }
    });

    // Center the view
    const bounds = this.world.getBounds();
    const scaleX = this.app.screen.width / bounds.width;
    const scaleY = this.app.screen.height / bounds.height;
    const scale = Math.min(scaleX, scaleY) * 0.85;
    this.world.scale.set(scale);
    this.world.x =
      (this.app.screen.width - bounds.width * scale) / 2 - bounds.x * scale;
    this.world.y =
      (this.app.screen.height - bounds.height * scale) / 2 - bounds.y * scale;
  }
}

function animateIn(sprite: PIXI.Container, targetY: number): void {
  const startY = sprite.y;
  const duration = 500;
  const startTime = Date.now();

  function tick() {
    const elapsed = Date.now() - startTime;
    const t = Math.min(1, elapsed / duration);
    // Ease-out back (slight overshoot for bouncy feel)
    const c1 = 1.2;
    const ease = 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    sprite.y = startY + (targetY - startY) * ease;
    sprite.alpha = Math.min(1, t * 2);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function updateParticles(container: PIXI.Container): void {
  for (const child of container.children) {
    const p = child as PIXI.Graphics & { _vy: number; _vx: number; _baseAlpha: number };
    p.y += p._vy;
    p.x += p._vx;
    p.alpha = p._baseAlpha + Math.sin(Date.now() * 0.002 + p.x) * 0.15;
    if (p.y > 2100) { p.y = -10; p.x = Math.random() * 2000; }
    if (p.x > 2100) p.x = -10;
    if (p.x < -10) p.x = 2100;
  }
}
