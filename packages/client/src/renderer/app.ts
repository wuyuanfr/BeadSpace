import * as PIXI from "pixi.js";
import type { WorkspaceGraph, BeadNode } from "@beadspace/shared";
import { createFolderRegion } from "./folder-region.js";
import { createBeadNode } from "./bead-node.js";
import { setupViewport } from "../camera/viewport.js";
import { showTooltip, hideTooltip } from "./tooltip.js";
import { showSidebar } from "../ui/sidebar.js";

export class BeadSpaceApp {
  private app!: PIXI.Application;
  private world!: PIXI.Container;

  async init(container: HTMLElement): Promise<void> {
    this.app = new PIXI.Application();
    await this.app.init({
      resizeTo: container,
      backgroundColor: 0x0d0d1a,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    container.appendChild(this.app.canvas);

    this.world = new PIXI.Container();
    this.app.stage.addChild(this.world);
    this.app.stage.eventMode = "static";

    setupViewport(this.app, this.world);
  }

  renderGraph(graph: WorkspaceGraph): void {
    this.world.removeChildren();

    const folders = graph.nodes.filter((n) => n.type === "folder");
    const files = graph.nodes.filter((n) => n.type === "file");

    // Render folder regions first (background)
    for (const folder of folders) {
      const region = createFolderRegion(folder);
      this.world.addChild(region);
    }

    // Render file beads on top with staggered animation
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bead = createBeadNode(file);

      bead.eventMode = "static";
      bead.cursor = "pointer";

      bead.on("pointerover", (e: PIXI.FederatedPointerEvent) => {
        showTooltip(file, e.globalX, e.globalY);
      });
      bead.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
        showTooltip(file, e.globalX, e.globalY);
      });
      bead.on("pointerout", () => hideTooltip());
      bead.on("pointertap", () => showSidebar(file));

      // Entrance animation
      const targetY = bead.y;
      bead.y = targetY - 20;
      bead.alpha = 0;
      const delay = Math.min(i * 2, 500);
      setTimeout(() => {
        animateIn(bead, targetY);
      }, delay);

      this.world.addChild(bead);
    }

    // Center the view
    const bounds = this.world.getBounds();
    const scaleX = this.app.screen.width / bounds.width;
    const scaleY = this.app.screen.height / bounds.height;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    this.world.scale.set(scale);
    this.world.x =
      (this.app.screen.width - bounds.width * scale) / 2 - bounds.x * scale;
    this.world.y =
      (this.app.screen.height - bounds.height * scale) / 2 - bounds.y * scale;
  }
}

function animateIn(sprite: PIXI.Container, targetY: number): void {
  const startY = sprite.y;
  const duration = 300;
  const startTime = Date.now();

  function tick() {
    const elapsed = Date.now() - startTime;
    const t = Math.min(1, elapsed / duration);
    const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
    sprite.y = startY + (targetY - startY) * ease;
    sprite.alpha = ease;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
