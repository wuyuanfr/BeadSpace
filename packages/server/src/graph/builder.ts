import type { BeadNode, WorkspaceGraph } from "@beadspace/shared";

export function buildGraph(
  nodes: BeadNode[],
  rootPath: string
): WorkspaceGraph {
  const nodeMap = new Map<string, BeadNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Build children arrays for folders
  for (const node of nodes) {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node.id);
      }
    }
  }

  // Compute folder importance as sum of children
  computeFolderImportance(nodes, nodeMap);

  // Count languages
  const languages: Record<string, number> = {};
  let totalFiles = 0;
  let totalFolders = 0;
  for (const node of nodes) {
    if (node.type === "file") {
      totalFiles++;
      const lang = node.language ?? "unknown";
      languages[lang] = (languages[lang] ?? 0) + 1;
    } else {
      totalFolders++;
    }
  }

  const rootName = rootPath.split(/[/\\]/).pop() ?? rootPath;

  return {
    rootPath,
    rootName,
    nodes,
    metadata: {
      totalFiles,
      totalFolders,
      languages,
      scanTimestamp: new Date().toISOString(),
    },
  };
}

function computeFolderImportance(
  nodes: BeadNode[],
  nodeMap: Map<string, BeadNode>
): void {
  // Process from deepest to shallowest
  const sorted = [...nodes].sort((a, b) => b.depth - a.depth);
  for (const node of sorted) {
    if (node.type === "folder" && node.children) {
      let sum = 0;
      for (const childId of node.children) {
        const child = nodeMap.get(childId);
        if (child) sum += child.importance;
      }
      node.importance = Math.max(0.05, sum);
    }
  }
}
