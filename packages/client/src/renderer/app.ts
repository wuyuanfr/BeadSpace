import * as PIXI from "pixi.js";
import type {
  WorkspaceGraph,
  FileBeadNode,
  FolderBeadNode,
} from "@beadspace/shared";
import { CellStateMap } from "./cell-state.js";
import { Region, buildRegionCells } from "./region.js";
import { setupViewport } from "../camera/viewport.js";
import { showTooltip, hideTooltip } from "./tooltip.js";
import { showDetailCard } from "../ui/detail-card.js";
import { IronTool } from "../tools/iron-tool.js";

const BG_COLOR = 0xf9f8f4;

export class BeadSpaceApp {
  private app!: PIXI.Application;
  private world!: PIXI.Container;
  private regions: Region[] = [];
  private cellState = new CellStateMap();
  private pinSpacing = 14;
  ironTool!: IronTool;

  async init(container: HTMLElement): Promise<void> {
    this.app = new PIXI.Application();
    await this.app.init({
      resizeTo: container,
      backgroundColor: BG_COLOR,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    container.appendChild(this.app.canvas);

    this.world = new PIXI.Container();
    this.app.stage.addChild(this.world);
    this.app.stage.eventMode = "static";

    setupViewport(this.app, this.world);

    this.ironTool = new IronTool(this);

    this.app.ticker.add(() => {
      this.ironTool.tick();
      for (const region of this.regions) {
        if (region.dirty) {
          region.redraw(this.cellState);
        }
      }
    });
  }

  resize(): void {
    this.app.resize();
  }

  renderGraph(graph: WorkspaceGraph): void {
    this.pinSpacing = graph.pinSpacing;

    for (const r of this.regions) r.destroy();
    this.regions = [];
    this.cellState.reset();
    this.world.removeChildren();
    this.ironTool?.attachToWorld(this.world);

    const filesByParent = new Map<string, FileBeadNode[]>();
    const foldersByParent = new Map<string, FolderBeadNode[]>();

    for (const node of graph.nodes) {
      const pid = node.parentId ?? "";
      if (node.type === "file") {
        if (!filesByParent.has(pid)) filesByParent.set(pid, []);
        filesByParent.get(pid)!.push(node);
      } else if (node.id !== "") {
        if (!foldersByParent.has(pid)) foldersByParent.set(pid, []);
        foldersByParent.get(pid)!.push(node);
      }
    }

    const folderNodes = graph.nodes.filter(
      (n): n is FolderBeadNode => n.type === "folder"
    );

    for (const folder of folderNodes) {
      const childFiles = filesByParent.get(folder.id) ?? [];
      const childFolders = foldersByParent.get(folder.id) ?? [];
      const { cells, cellOwners } = buildRegionCells(
        folder,
        childFiles,
        childFolders
      );
      const region = new Region(folder, cells, cellOwners, this.pinSpacing);

      region.container.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
        if (this.ironTool.isActive()) return;
        const local = e.getLocalPosition(region.container);
        const cellX =
          Math.floor(local.x / this.pinSpacing) + folder.gridX;
        const cellY =
          Math.floor(local.y / this.pinSpacing) + folder.gridY;
        const file = region.getCellOwner(cellX, cellY);
        if (file) showTooltip(file, e.globalX, e.globalY);
        else hideTooltip();
      });
      region.container.on("pointerleave", () => {
        hideTooltip();
      });
      region.container.on("pointertap", (e: PIXI.FederatedPointerEvent) => {
        if (this.ironTool.isActive()) return;
        const local = e.getLocalPosition(region.container);
        const cellX =
          Math.floor(local.x / this.pinSpacing) + folder.gridX;
        const cellY =
          Math.floor(local.y / this.pinSpacing) + folder.gridY;
        const file = region.getCellOwner(cellX, cellY);
        if (file) showDetailCard(file);
      });

      this.regions.push(region);
      this.world.addChild(region.container);
    }

    const root = folderNodes.find((f) => f.id === "");
    if (root) {
      const w = root.gridCols * this.pinSpacing;
      const h = root.gridRows * this.pinSpacing;
      const sx = this.app.screen.width / w;
      const sy = this.app.screen.height / h;
      const scale = Math.min(sx, sy) * 0.9;
      this.world.scale.set(scale);
      this.world.x = (this.app.screen.width - w * scale) / 2;
      this.world.y = (this.app.screen.height - h * scale) / 2;
    }

    for (const r of this.regions) r.redraw(this.cellState);
  }

  getRegions(): Region[] {
    return this.regions;
  }
  getCellState(): CellStateMap {
    return this.cellState;
  }
  getWorld(): PIXI.Container {
    return this.world;
  }
  getPinSpacing(): number {
    return this.pinSpacing;
  }
  getApp(): PIXI.Application {
    return this.app;
  }

  setAllCold(): void {
    this.cellState.reset();
    for (const r of this.regions) r.dirty = true;
  }

  setAllFused(): void {
    for (const r of this.regions) {
      this.cellState.setAllCells(r.cells, { temperature: 1, fused: true });
      r.dirty = true;
    }
  }

  resetBoard(): void {
    this.setAllCold();
  }
}
