import fs from "node:fs/promises";
import path from "node:path";
import ignore, { type Ignore } from "ignore";
import type { RawFileEntry } from "@beadspace/shared";

const DEFAULT_SKIP = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "__pycache__",
  ".venv",
  ".next",
  ".nuxt",
  "coverage",
  ".cache",
  ".idea",
  ".vscode",
]);

const MAX_DEPTH = 8;
const MAX_NODES = 5000;

async function loadGitignore(dir: string): Promise<Ignore> {
  const ig = ignore();
  try {
    const content = await fs.readFile(path.join(dir, ".gitignore"), "utf-8");
    ig.add(content);
  } catch {
    // no .gitignore
  }
  return ig;
}

export async function scanFileTree(rootPath: string): Promise<RawFileEntry[]> {
  const entries: RawFileEntry[] = [];
  const ig = await loadGitignore(rootPath);

  async function walk(
    dir: string,
    relativePath: string,
    depth: number,
    parentPath?: string
  ): Promise<void> {
    if (depth > MAX_DEPTH || entries.length >= MAX_NODES) return;

    const dirents = await fs.readdir(dir, { withFileTypes: true });

    for (const dirent of dirents) {
      if (entries.length >= MAX_NODES) return;
      if (DEFAULT_SKIP.has(dirent.name)) continue;
      if (dirent.name.startsWith(".") && dirent.name !== ".gitignore") continue;

      const relPath = relativePath
        ? `${relativePath}/${dirent.name}`
        : dirent.name;

      if (ig.ignores(relPath)) continue;

      const fullPath = path.join(dir, dirent.name);

      if (dirent.isDirectory()) {
        entries.push({
          path: relPath,
          name: dirent.name,
          type: "folder",
          depth,
          parentPath,
        });
        await walk(fullPath, relPath, depth + 1, relPath);
      } else if (dirent.isFile()) {
        const ext = path.extname(dirent.name);
        let sizeBytes = 0;
        try {
          const stat = await fs.stat(fullPath);
          sizeBytes = stat.size;
        } catch {
          // skip unreadable files
        }
        entries.push({
          path: relPath,
          name: dirent.name,
          type: "file",
          extension: ext,
          sizeBytes,
          depth,
          parentPath,
        });
      }
    }
  }

  await walk(rootPath, "", 0);
  return entries;
}
