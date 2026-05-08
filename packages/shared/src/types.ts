import type { PerlerColor } from "./perler-palette.js";

export interface RawFileEntry {
  path: string;
  name: string;
  type: "file" | "folder";
  extension?: string;
  sizeBytes?: number;
  depth: number;
  parentPath?: string;
}

export interface BeadCell {
  dx: number;
  dy: number;
  color: PerlerColor;
  layer?: number;
}

export interface BaseBeadNode {
  id: string;
  name: string;
  path: string;
  language?: string;
  extension?: string;
  sizeBytes?: number;
  gitCommitCount?: number;
  gitLastModified?: string;
  gitAuthors?: string[];
  gitRecentActivity?: number;
  parentId?: string;
  depth: number;
  importance: number;
  gridX: number;
  gridY: number;
}

export interface FileBeadNode extends BaseBeadNode {
  type: "file";
  sprite: BeadCell[];
  labelSprite: BeadCell[];
  spriteWidth: number;
  spriteHeight: number;
}

export interface FolderBeadNode extends BaseBeadNode {
  type: "folder";
  children: string[];
  gridCols: number;
  gridRows: number;
  labelSprite: BeadCell[];
  labelOffsetX: number;
  labelOffsetY: number;
}

export type BeadNode = FileBeadNode | FolderBeadNode;

export interface WorkspaceGraph {
  rootPath: string;
  rootName: string;
  nodes: BeadNode[];
  pinSpacing: number;
  metadata: {
    totalFiles: number;
    totalFolders: number;
    languages: Record<string, number>;
    scanTimestamp: string;
  };
}
