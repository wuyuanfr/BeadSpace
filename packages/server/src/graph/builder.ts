import type {
  BeadNode,
  WorkspaceGraph,
} from "@beadspace/shared";

export function buildGraph(
  nodes: BeadNode[],
  rootPath: string,
  pinSpacing: number
): WorkspaceGraph {
  const nodeMap = new Map<string, BeadNode>();
  for (const node of nodes) nodeMap.set(node.id, node);

  for (const node of nodes) {
    if (node.parentId !== undefined) {
      const parent = nodeMap.get(node.parentId);
      if (parent && parent.type === "folder") {
        parent.children.push(node.id);
      }
    }
  }

  const sorted = [...nodes].sort((a, b) => b.depth - a.depth);
  for (const node of sorted) {
    if (node.type === "folder") {
      let sum = 0;
      for (const childId of node.children) {
        const child = nodeMap.get(childId);
        if (child) sum += child.importance;
      }
      node.importance = Math.max(0.05, sum);
    }
  }

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
    pinSpacing,
    metadata: {
      totalFiles,
      totalFolders,
      languages,
      scanTimestamp: new Date().toISOString(),
    },
  };
}
