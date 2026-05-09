import * as PIXI from "pixi.js";
import type { BeadSpaceApp } from "../renderer/app.js";
import type { Region } from "../renderer/region.js";
import { setViewportPanEnabled } from "../camera/viewport.js";

const HEAT_PER_FRAME = 0.04;
const BRUSH_FILL = 0xff8c8e;
const BRUSH_STROKE = 0xff5c5e;
const IRON_BODY = 0x888888;
const IRON_PLATE = 0xc0c0c0;
const IRON_HANDLE = 0x4f4f4f;

export class IronTool {
  private app: BeadSpaceApp;
  private active = false;
  private pressing = false;
  private brushRadius = 4;
  private pointerWorldX = 0;
  private pointerWorldY = 0;
  private pointerKnown = false;
  private brushGraphic: PIXI.Graphics;

  constructor(app: BeadSpaceApp) {
    this.app = app;

    this.brushGraphic = new PIXI.Graphics();
    this.brushGraphic.visible = false;
    app.getWorld().addChild(this.brushGraphic);

    const canvas = app.getApp().canvas as HTMLCanvasElement;
    canvas.addEventListener("pointerdown", (e) => {
      if (!this.active || e.button !== 0) return;
      this.pressing = true;
      this.updatePointer(e);
    });
    window.addEventListener("pointerup", () => {
      this.pressing = false;
    });
    window.addEventListener("pointermove", (e) => {
      this.updatePointer(e);
    });
  }

  attachToWorld(world: PIXI.Container): void {
    if (this.brushGraphic.parent) this.brushGraphic.parent.removeChild(this.brushGraphic);
    world.addChild(this.brushGraphic);
  }

  setActive(v: boolean): void {
    this.active = v;
    setViewportPanEnabled(!v);
    if (!v) this.pressing = false;
    this.brushGraphic.visible = v;
  }

  isActive(): boolean {
    return this.active;
  }

  setBrushRadius(r: number): void {
    this.brushRadius = Math.max(1, Math.min(20, r));
  }

  getBrushRadius(): number {
    return this.brushRadius;
  }

  private updatePointer(e: PointerEvent): void {
    const canvas = this.app.getApp().canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const world = this.app.getWorld();
    this.pointerWorldX = (mx - world.x) / world.scale.x;
    this.pointerWorldY = (my - world.y) / world.scale.y;
    this.pointerKnown = true;
  }

  tick(): void {
    if (!this.active) {
      this.brushGraphic.visible = false;
      return;
    }

    const S = this.app.getPinSpacing();
    const r = this.brushRadius;
    const r2 = r * r;

    if (this.pointerKnown) {
      const cellX = Math.floor(this.pointerWorldX / S);
      const cellY = Math.floor(this.pointerWorldY / S);
      const px = cellX * S + S / 2;
      const py = cellY * S + S / 2;

      this.brushGraphic.visible = true;
      this.brushGraphic.clear();
      drawIron(this.brushGraphic, px, py, r * S);
    }

    if (!this.pressing || !this.pointerKnown) return;

    const centerX = Math.floor(this.pointerWorldX / S);
    const centerY = Math.floor(this.pointerWorldY / S);

    const cellState = this.app.getCellState();

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r2) continue;
        cellState.heat(centerX + dx, centerY + dy, HEAT_PER_FRAME);
      }
    }

    const minX = centerX - r;
    const maxX = centerX + r;
    const minY = centerY - r;
    const maxY = centerY + r;

    const regions = this.app.getRegions();
    for (const region of regions) {
      if (rectsOverlap(region, minX, minY, maxX, maxY)) {
        region.dirty = true;
      }
    }
  }
}

function drawIron(g: PIXI.Graphics, cx: number, cy: number, radius: number): void {
  const w = radius * 2;
  const h = radius * 2.4;
  const tipY = cy + h * 0.5;
  const topY = cy - h * 0.5;

  // Soleplate: pointed bottom, wide top
  g.moveTo(cx, tipY);
  g.lineTo(cx + w * 0.5, cy - h * 0.05);
  g.lineTo(cx + w * 0.5, topY + h * 0.15);
  g.quadraticCurveTo(cx + w * 0.5, topY, cx + w * 0.35, topY);
  g.lineTo(cx - w * 0.35, topY);
  g.quadraticCurveTo(cx - w * 0.5, topY, cx - w * 0.5, topY + h * 0.15);
  g.lineTo(cx - w * 0.5, cy - h * 0.05);
  g.closePath();
  g.fill({ color: IRON_PLATE, alpha: 0.45 });
  g.stroke({ color: IRON_BODY, width: 2, alpha: 0.8 });

  // Handle
  const handleW = w * 0.2;
  const handleH = h * 0.35;
  const handleY = topY - handleH * 0.15;
  g.roundRect(cx - handleW / 2, handleY, handleW, handleH, handleW * 0.3);
  g.fill({ color: IRON_HANDLE, alpha: 0.55 });
  g.stroke({ color: IRON_HANDLE, width: 1.5, alpha: 0.7 });

  // Heat glow under the tip
  g.circle(cx, cy + h * 0.15, radius * 0.5);
  g.fill({ color: BRUSH_FILL, alpha: 0.2 });
}

function rectsOverlap(
  region: Region,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): boolean {
  const rxMin = region.node.gridX;
  const rxMax = region.node.gridX + region.node.gridCols - 1;
  const ryMin = region.node.gridY;
  const ryMax = region.node.gridY + region.node.gridRows - 1;
  return !(maxX < rxMin || minX > rxMax || maxY < ryMin || minY > ryMax);
}
