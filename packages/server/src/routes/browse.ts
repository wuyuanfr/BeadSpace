import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export const browseRouter = Router();

browseRouter.get("/browse-home", (_req, res) => {
  res.json({ path: os.homedir() });
});

browseRouter.get("/browse", async (req, res) => {
  const target = req.query.path as string | undefined;
  if (!target) {
    res.status(400).json({ error: "Missing 'path' query parameter" });
    return;
  }

  try {
    const absolute = path.resolve(target);
    const dirents = await fs.readdir(absolute, { withFileTypes: true });
    const entries = dirents
      .filter((d) => d.isDirectory())
      .filter((d) => !d.name.startsWith(".") || d.name === "..")
      .map((d) => ({
        name: d.name,
        path: path.join(absolute, d.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const parent = path.dirname(absolute);
    res.json({
      path: absolute,
      parent: parent === absolute ? null : parent,
      entries,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});
