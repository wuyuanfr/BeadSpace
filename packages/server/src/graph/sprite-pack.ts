import {
  getPerlerColor,
  renderLabel,
  measureLabel,
  truncateToWidth,
  FONT_GLYPH_HEIGHT,
} from "@beadspace/shared";
import type {
  BeadCell,
  BeadNode,
  FileBeadNode,
  FolderBeadNode,
  PerlerColor,
} from "@beadspace/shared";

const FOLDER_PADDING = 2;
const FOLDER_LABEL_HEIGHT = FONT_GLYPH_HEIGHT + 2;
const SPRITE_LABEL_GAP = 1;
const SPRITE_INTER_GAP = 2;
const MAX_FILENAME_LABEL_WIDTH = 32;
const MAX_FOLDER_LABEL_WIDTH = 40;

const MIN_DISK_RADIUS = 1;
const MAX_DISK_RADIUS = 7;
const README_MIN_RADIUS = 4;
const DOCKER_MIN_RADIUS = 3;

function diskRadius(importance: number): number {
  const r = Math.round(
    MIN_DISK_RADIUS + Math.sqrt(Math.min(1, importance)) * (MAX_DISK_RADIUS - MIN_DISK_RADIUS)
  );
  return Math.max(MIN_DISK_RADIUS, Math.min(MAX_DISK_RADIUS, r));
}

function buildDisk(radius: number, color: PerlerColor): BeadCell[] {
  const cells: BeadCell[] = [];
  const center = radius;
  const size = 2 * radius + 1;
  const r2 = (radius + 0.5) * (radius + 0.5);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      if (dx * dx + dy * dy <= r2) {
        cells.push({ dx: x, dy: y, color });
      }
    }
  }
  return cells;
}

function buildSquare(radius: number, color: PerlerColor): BeadCell[] {
  const cells: BeadCell[] = [];
  const size = 2 * radius + 1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      cells.push({ dx: x, dy: y, color });
    }
  }
  return cells;
}

interface RoleOverride {
  match: (file: FileBeadNode) => boolean;
  build: (file: FileBeadNode) => BeadCell[];
}

const ROLE_OVERRIDES: RoleOverride[] = [
  {
    match: (f) => /^readme(\.|$)/i.test(f.name),
    build: (f) => buildDisk(Math.max(diskRadius(f.importance), README_MIN_RADIUS), "gold"),
  },
  {
    match: (f) =>
      f.name === "Dockerfile" ||
      f.name === ".dockerignore" ||
      f.name === "docker-compose.yml" ||
      f.name === "docker-compose.yaml",
    build: (f) => buildSquare(Math.max(diskRadius(f.importance), DOCKER_MIN_RADIUS), "navy"),
  },
];

function buildFileSprite(file: FileBeadNode): void {
  let bodyCells: BeadCell[] = [];
  for (const ovr of ROLE_OVERRIDES) {
    if (ovr.match(file)) {
      bodyCells = ovr.build(file);
      break;
    }
  }
  if (bodyCells.length === 0) {
    const color = getPerlerColor(file.language ?? "unknown");
    bodyCells = buildDisk(diskRadius(file.importance), color);
  }

  let bodyW = 0;
  let bodyH = 0;
  for (const c of bodyCells) {
    if (c.dx + 1 > bodyW) bodyW = c.dx + 1;
    if (c.dy + 1 > bodyH) bodyH = c.dy + 1;
  }

  const labelText = truncateToWidth(file.name, MAX_FILENAME_LABEL_WIDTH);
  const labelMeasure = measureLabel(labelText);

  const totalW = Math.max(bodyW, labelMeasure.width);
  const labelOriginX = Math.floor((totalW - labelMeasure.width) / 2);
  const labelOriginY = bodyH + SPRITE_LABEL_GAP;
  const label = renderLabel(labelText, "black", labelOriginX, labelOriginY);

  const bodyOffsetX = Math.floor((totalW - bodyW) / 2);
  const offsetBody = bodyCells.map((c) => ({ ...c, dx: c.dx + bodyOffsetX }));

  file.sprite = offsetBody;
  file.labelSprite = label.cells;
  file.spriteWidth = totalW;
  file.spriteHeight = labelOriginY + label.height;
}

interface ChildSlot {
  child: BeadNode;
  width: number;
  height: number;
  relX: number;
  relY: number;
}

type ChildPositions = Map<string, { relX: number; relY: number }>;

export function packAllFolders(
  nodes: BeadNode[],
  rootId: string
): void {
  const nodeMap = new Map<string, BeadNode>();
  for (const node of nodes) nodeMap.set(node.id, node);

  const root = nodeMap.get(rootId);
  if (!root || root.type !== "folder") return;

  const childPositions: ChildPositions = new Map();
  packFolderRecursive(root, nodeMap, childPositions);
  setWorldGridCoords(root, 0, 0, nodeMap, childPositions);
}

function packFolderRecursive(
  folder: FolderBeadNode,
  nodeMap: Map<string, BeadNode>,
  childPositions: ChildPositions
): void {
  for (const childId of folder.children) {
    const child = nodeMap.get(childId);
    if (!child) continue;
    if (child.type === "folder") {
      packFolderRecursive(child, nodeMap, childPositions);
    } else {
      buildFileSprite(child);
    }
  }

  const folderLabelText = truncateToWidth(folder.name, MAX_FOLDER_LABEL_WIDTH);
  const folderLabelMeasure = measureLabel(folderLabelText);
  const folderLabelMinW = folderLabelMeasure.width;

  if (folder.children.length === 0) {
    const interiorW = Math.max(folderLabelMinW, 6);
    folder.gridCols = interiorW + 2 * FOLDER_PADDING;
    folder.gridRows = FOLDER_LABEL_HEIGHT + FOLDER_PADDING + 2;
  } else {
    const slots: ChildSlot[] = folder.children
      .map((id) => nodeMap.get(id)!)
      .filter((c): c is BeadNode => Boolean(c))
      .map((child) => {
        if (child.type === "file") {
          return { child, width: child.spriteWidth, height: child.spriteHeight, relX: 0, relY: 0 };
        }
        return { child, width: child.gridCols, height: child.gridRows, relX: 0, relY: 0 };
      });

    slots.sort((a, b) => b.width * b.height - a.width * a.height);

    const totalArea = slots.reduce((s, t) => s + t.width * t.height, 0);
    const widestChild = slots.reduce((m, t) => Math.max(m, t.width), 0);
    const targetW = Math.max(widestChild, Math.ceil(Math.sqrt(totalArea * 1.4)));

    let cursorX = 0;
    let cursorY = 0;
    let rowH = 0;
    let maxX = 0;
    for (const slot of slots) {
      if (cursorX > 0 && cursorX + slot.width > targetW) {
        cursorY += rowH + SPRITE_INTER_GAP;
        cursorX = 0;
        rowH = 0;
      }
      slot.relX = cursorX;
      slot.relY = cursorY;
      childPositions.set(slot.child.id, { relX: cursorX, relY: cursorY });
      cursorX += slot.width + SPRITE_INTER_GAP;
      rowH = Math.max(rowH, slot.height);
      if (cursorX - SPRITE_INTER_GAP > maxX) maxX = cursorX - SPRITE_INTER_GAP;
    }
    cursorY += rowH;

    const interiorW = Math.max(maxX, folderLabelMinW);
    const interiorH = cursorY;

    folder.gridCols = interiorW + 2 * FOLDER_PADDING;
    folder.gridRows = interiorH + FOLDER_LABEL_HEIGHT + FOLDER_PADDING;
  }

  const folderLabelOriginX = Math.floor((folder.gridCols - folderLabelMinW) / 2);
  const folderLabelOriginY = Math.max(1, Math.floor((FOLDER_LABEL_HEIGHT - FONT_GLYPH_HEIGHT) / 2));
  folder.labelSprite = renderLabel(
    folderLabelText,
    "black",
    folderLabelOriginX,
    folderLabelOriginY
  ).cells;
  folder.labelOffsetX = folderLabelOriginX;
  folder.labelOffsetY = folderLabelOriginY;
}

function setWorldGridCoords(
  folder: FolderBeadNode,
  worldX: number,
  worldY: number,
  nodeMap: Map<string, BeadNode>,
  childPositions: ChildPositions
): void {
  folder.gridX = worldX;
  folder.gridY = worldY;

  for (const childId of folder.children) {
    const child = nodeMap.get(childId);
    if (!child) continue;
    const pos = childPositions.get(child.id);
    if (!pos) continue;
    const interiorX = FOLDER_PADDING + pos.relX;
    const interiorY = FOLDER_LABEL_HEIGHT + pos.relY;
    if (child.type === "file") {
      child.gridX = worldX + interiorX;
      child.gridY = worldY + interiorY;
    } else {
      setWorldGridCoords(child, worldX + interiorX, worldY + interiorY, nodeMap, childPositions);
    }
  }
}
