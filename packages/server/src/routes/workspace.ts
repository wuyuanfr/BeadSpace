import { Router } from "express";
import { scanFileTree } from "../scanner/file-tree.js";
import { analyzeGit } from "../scanner/git-analyzer.js";
import { enrichEntries } from "../scanner/metadata.js";
import { buildGraph } from "../graph/builder.js";
import { layoutTreemap } from "../graph/layout.js";

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

    const nodes = enrichEntries(entries, gitData);
    const graph = buildGraph(nodes, targetPath);
    layoutTreemap(graph.nodes);

    res.json(graph);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});
