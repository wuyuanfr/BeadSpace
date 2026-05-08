export interface RawFileEntry {
  path: string;
  name: string;
  type: "file" | "folder";
  extension?: string;
  sizeBytes?: number;
  depth: number;
  parentPath?: string;
}

export interface BeadNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  language?: string;
  extension?: string;
  sizeBytes?: number;
  lineCount?: number;
  gitCommitCount?: number;
  gitLastModified?: string;
  gitAuthors?: string[];
  gitRecentActivity?: number;
  parentId?: string;
  children?: string[];
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  brightness: number;
  importance: number;
}

export interface WorkspaceGraph {
  rootPath: string;
  rootName: string;
  nodes: BeadNode[];
  metadata: {
    totalFiles: number;
    totalFolders: number;
    languages: Record<string, number>;
    scanTimestamp: string;
  };
}
