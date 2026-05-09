import { Router } from "express";
import { scanFileTree } from "../scanner/file-tree.js";
import { analyzeGit } from "../scanner/git-analyzer.js";
import { enrichEntries } from "../scanner/metadata.js";
import { buildGraph } from "../graph/builder.js";
import { packAllFolders } from "../graph/sprite-pack.js";
import type { BeadNode, FolderBeadNode } from "@beadspace/shared";

const PIN_SPACING = 14;
const ROOT_ID = "";

export const workspaceRouter = Router();

workspaceRouter.get("/workspace", async (req, res) => {
  const targetPath = req.query.path as string | undefined;
  if (!targetPath) {
    res.status(400).json({ error: "Missing 'path' query parameter" });
    return;
  }

  try {
    const [entries, gitData] = await Promise.all([
      scanFileTree(targetPath),
      analyzeGit(targetPath),
    ]);

    const enriched = enrichEntries(entries, gitData);
    const rootName = targetPath.split(/[/\\]/).filter(Boolean).pop() ?? targetPath;
    const rootFolder: FolderBeadNode = {
      type: "folder",
      id: ROOT_ID,
      name: rootName,
      path: "",
      depth: -1,
      importance: 0,
      gridX: 0,
      gridY: 0,
      parentId: undefined,
      children: [],
      gridCols: 0,
      gridRows: 0,
      labelSprite: [],
      labelOffsetX: 0,
      labelOffsetY: 0,
    };

    const allNodes: BeadNode[] = [rootFolder, ...enriched];
    for (const n of enriched) {
      if (!n.parentId) n.parentId = ROOT_ID;
    }

    const graph = buildGraph(allNodes, targetPath, PIN_SPACING);
    packAllFolders(allNodes, ROOT_ID);

    for (const node of allNodes) {
      if (node.type === "folder") {
        if (!node.labelSprite) node.labelSprite = [];
      } else {
        if (!node.sprite) node.sprite = [];
        if (!node.labelSprite) node.labelSprite = [];
      }
    }

    res.json(graph);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});
