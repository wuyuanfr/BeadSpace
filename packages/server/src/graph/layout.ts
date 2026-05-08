import type { BeadNode } from "@beadspace/shared";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FOLDER_PADDING = 6;
const FOLDER_HEADER = 18;
const MIN_BEAD = 12;

export function layoutTreemap(nodes: BeadNode[], canvasSize = 2000): void {
  const nodeMap = new Map<string, BeadNode>();
  for (const node of nodes) nodeMap.set(node.id, node);

  const rootNodes = nodes.filter((n) => !n.parentId);
  const rootRect: Rect = { x: 0, y: 0, w: canvasSize, h: canvasSize };

  layoutChildren(rootNodes, rootRect, nodeMap, 0);
}

function layoutChildren(
  children: BeadNode[],
  rect: Rect,
  nodeMap: Map<string, BeadNode>,
  depth: number
): void {
  if (children.length === 0) return;

  const totalImportance = children.reduce((s, c) => s + c.importance, 0);
  if (totalImportance <= 0) return;

  // Squarified treemap: lay out children to minimize aspect ratios
  const sorted = [...children].sort((a, b) => b.importance - a.importance);
  squarify(sorted, rect, totalImportance, nodeMap, depth);
}

function squarify(
  children: BeadNode[],
  rect: Rect,
  totalImportance: number,
  nodeMap: Map<string, BeadNode>,
  depth: number
): void {
  if (children.length === 0) return;
  if (children.length === 1) {
    placeNode(children[0], rect, nodeMap, depth);
    return;
  }

  const horizontal = rect.w >= rect.h;
  const totalArea = rect.w * rect.h;

  // Use slice-and-dice with aspect ratio optimization
  let bestRatio = Infinity;
  let splitIdx = 1;

  let runningImportance = 0;
  for (let i = 0; i < children.length - 1; i++) {
    runningImportance += children[i].importance;
    const fraction = runningImportance / totalImportance;

    let stripW: number, stripH: number;
    if (horizontal) {
      stripW = rect.w * fraction;
      stripH = rect.h;
    } else {
      stripW = rect.w;
      stripH = rect.h * fraction;
    }

    // Compute worst aspect ratio in this strip
    let worstRatio = 0;
    let subRunning = 0;
    for (let j = 0; j <= i; j++) {
      subRunning += children[j].importance;
      const subFrac = children[j].importance / runningImportance;
      let itemW: number, itemH: number;
      if (horizontal) {
        itemW = stripW;
        itemH = stripH * subFrac;
      } else {
        itemW = stripW * subFrac;
        itemH = stripH;
      }
      const ratio = Math.max(itemW / Math.max(itemH, 1), itemH / Math.max(itemW, 1));
      worstRatio = Math.max(worstRatio, ratio);
    }

    if (worstRatio < bestRatio) {
      bestRatio = worstRatio;
      splitIdx = i + 1;
    }
  }

  const firstGroup = children.slice(0, splitIdx);
  const secondGroup = children.slice(splitIdx);
  const firstImportance = firstGroup.reduce((s, c) => s + c.importance, 0);
  const fraction = firstImportance / totalImportance;

  let rect1: Rect, rect2: Rect;
  if (horizontal) {
    const splitX = rect.x + rect.w * fraction;
    rect1 = { x: rect.x, y: rect.y, w: rect.w * fraction, h: rect.h };
    rect2 = {
      x: splitX,
      y: rect.y,
      w: rect.w * (1 - fraction),
      h: rect.h,
    };
  } else {
    const splitY = rect.y + rect.h * fraction;
    rect1 = { x: rect.x, y: rect.y, w: rect.w, h: rect.h * fraction };
    rect2 = {
      x: rect.x,
      y: splitY,
      w: rect.w,
      h: rect.h * (1 - fraction),
    };
  }

  squarify(firstGroup, rect1, firstImportance, nodeMap, depth);
  squarify(
    secondGroup,
    rect2,
    totalImportance - firstImportance,
    nodeMap,
    depth
  );
}

function placeNode(
  node: BeadNode,
  rect: Rect,
  nodeMap: Map<string, BeadNode>,
  depth: number
): void {
  node.x = rect.x;
  node.y = rect.y;
  node.width = Math.max(MIN_BEAD, rect.w);
  node.height = Math.max(MIN_BEAD, rect.h);

  if (node.type === "folder" && node.children && node.children.length > 0) {
    const innerRect: Rect = {
      x: rect.x + FOLDER_PADDING,
      y: rect.y + FOLDER_HEADER,
      w: Math.max(MIN_BEAD, rect.w - FOLDER_PADDING * 2),
      h: Math.max(MIN_BEAD, rect.h - FOLDER_HEADER - FOLDER_PADDING),
    };

    const childNodes = node.children
      .map((id) => nodeMap.get(id))
      .filter((n): n is BeadNode => !!n);

    layoutChildren(childNodes, innerRect, nodeMap, depth + 1);
  }
}
