import * as PIXI from "pixi.js";
import {
  perlerHexInt,
  type FileBeadNode,
  type FolderBeadNode,
  type PerlerColor,
} from "@beadspace/shared";
import { cellKey, type CellStateMap } from "./cell-state.js";

export interface AbsoluteCell {
  x: number;
  y: number;
  color: PerlerColor;
}

const BOARD_COLOR = 0xf4ecc8;
const BOARD_FRAME_COLOR = 0xa89c80;
const PIN_COLOR = 0xc6b89e;

const PIN_RADIUS_RATIO = 0.07;
const RING_OUTER_COLD = 0.4;
const RING_OUTER_FUSED = 0.52;
const RING_INNER_COLD = 0.2;
const RING_INNER_FUSED = 0;

export class Region {
  node: FolderBeadNode;
  cells: AbsoluteCell[];
  cellOwners: Map<string, FileBeadNode>;

  container: PIXI.Container;
  bgGraphic: PIXI.Graphics;
  pinGraphic: PIXI.Graphics;
  beadGraphic: PIXI.Graphics;

  dirty = true;
  pinSpacing: number;

  constructor(
    node: FolderBeadNode,
    cells: AbsoluteCell[],
    cellOwners: Map<string, FileBeadNode>,
    pinSpacing: number
  ) {
    this.node = node;
    this.cells = cells;
    this.cellOwners = cellOwners;
    this.pinSpacing = pinSpacing;

    this.container = new PIXI.Container();
    this.container.x = node.gridX * pinSpacing;
    this.container.y = node.gridY * pinSpacing;
    this.container.eventMode = "static";

    this.bgGraphic = new PIXI.Graphics();
    this.pinGraphic = new PIXI.Graphics();
    this.beadGraphic = new PIXI.Graphics();

    this.container.addChild(this.bgGraphic);
    this.container.addChild(this.pinGraphic);
    this.container.addChild(this.beadGraphic);

    this.drawStatic();
  }

  private drawStatic(): void {
    const w = this.node.gridCols * this.pinSpacing;
    const h = this.node.gridRows * this.pinSpacing;

    this.bgGraphic.clear();
    this.bgGraphic.roundRect(0, 0, w, h, 4).fill(BOARD_COLOR);
    this.bgGraphic
      .roundRect(0, 0, w, h, 4)
      .stroke({ color: BOARD_FRAME_COLOR, width: 1.5 });

    this.pinGraphic.clear();
    const pinR = this.pinSpacing * PIN_RADIUS_RATIO;
    for (let r = 0; r < this.node.gridRows; r++) {
      for (let c = 0; c < this.node.gridCols; c++) {
        const cx = c * this.pinSpacing + this.pinSpacing / 2;
        const cy = r * this.pinSpacing + this.pinSpacing / 2;
        this.pinGraphic.circle(cx, cy, pinR);
      }
    }
    this.pinGraphic.fill({ color: PIN_COLOR, alpha: 0.6 });
  }

  redraw(cellState: CellStateMap): void {
    this.beadGraphic.clear();

    const folderX = this.node.gridX;
    const folderY = this.node.gridY;
    const S = this.pinSpacing;

    const byColor = new Map<
      number,
      { cx: number; cy: number; r: number }[]
    >();
    const innerPunches: { cx: number; cy: number; r: number }[] = [];

    for (const cell of this.cells) {
      const t = cellState.get(cell.x, cell.y).temperature;
      const outer = lerp(RING_OUTER_COLD, RING_OUTER_FUSED, t) * S;
      const inner = lerp(RING_INNER_COLD, RING_INNER_FUSED, t) * S;
      const cx = (cell.x - folderX) * S + S / 2;
      const cy = (cell.y - folderY) * S + S / 2;
      const hex = perlerHexInt(cell.color);

      let bucket = byColor.get(hex);
      if (!bucket) {
        bucket = [];
        byColor.set(hex, bucket);
      }
      bucket.push({ cx, cy, r: outer });

      if (inner > 0.4) {
        innerPunches.push({ cx, cy, r: inner });
      }
    }

    for (const [hex, group] of byColor) {
      for (const c of group) {
        this.beadGraphic.circle(c.cx, c.cy, c.r);
      }
      this.beadGraphic.fill(hex);
    }

    if (innerPunches.length > 0) {
      for (const p of innerPunches) {
        this.beadGraphic.circle(p.cx, p.cy, p.r);
      }
      this.beadGraphic.fill(BOARD_COLOR);
    }

    this.dirty = false;
  }

  getCellOwner(absX: number, absY: number): FileBeadNode | undefined {
    return this.cellOwners.get(cellKey(absX, absY));
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function pushCell(
  cells: AbsoluteCell[],
  covered: Set<string>,
  x: number,
  y: number,
  color: PerlerColor,
  cellOwners?: Map<string, FileBeadNode>,
  owner?: FileBeadNode
): void {
  const k = cellKey(x, y);
  if (covered.has(k)) return;
  cells.push({ x, y, color });
  covered.add(k);
  if (owner && cellOwners) cellOwners.set(k, owner);
}

export function buildRegionCells(
  folder: FolderBeadNode,
  childFiles: FileBeadNode[],
  childFolders: FolderBeadNode[]
): { cells: AbsoluteCell[]; cellOwners: Map<string, FileBeadNode> } {
  const cells: AbsoluteCell[] = [];
  const covered = new Set<string>();
  const cellOwners = new Map<string, FileBeadNode>();

  for (const c of folder.labelSprite ?? []) {
    pushCell(cells, covered, folder.gridX + c.dx, folder.gridY + c.dy, c.color);
  }

  for (const file of childFiles) {
    for (const c of file.sprite ?? []) {
      pushCell(cells, covered, file.gridX + c.dx, file.gridY + c.dy, c.color, cellOwners, file);
    }
    for (const c of file.labelSprite ?? []) {
      pushCell(cells, covered, file.gridX + c.dx, file.gridY + c.dy, c.color, cellOwners, file);
    }
  }

  for (const sub of childFolders) {
    for (let dy = 0; dy < sub.gridRows; dy++) {
      for (let dx = 0; dx < sub.gridCols; dx++) {
        covered.add(cellKey(sub.gridX + dx, sub.gridY + dy));
      }
    }
  }

  for (let dy = 0; dy < folder.gridRows; dy++) {
    for (let dx = 0; dx < folder.gridCols; dx++) {
      const ax = folder.gridX + dx;
      const ay = folder.gridY + dy;
      if (!covered.has(cellKey(ax, ay))) {
        cells.push({ x: ax, y: ay, color: "white" });
      }
    }
  }

  return { cells, cellOwners };
}
