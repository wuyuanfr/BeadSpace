import { getLanguage } from "@beadspace/shared";
import type {
  RawFileEntry,
  BeadNode,
} from "@beadspace/shared";
import type { GitData } from "./git-analyzer.js";

export function enrichEntries(
  entries: RawFileEntry[],
  gitData: GitData
): BeadNode[] {
  const maxCommits = Math.max(1, ...gitData.commitCounts.values());
  const maxSize = Math.max(
    1,
    ...entries.filter((e) => e.type === "file").map((e) => e.sizeBytes ?? 0)
  );

  return entries.map((entry): BeadNode => {
    const commits = gitData.commitCounts.get(entry.path) ?? 0;
    const recent = gitData.recentActivity.get(entry.path) ?? 0;
    const lastMod = gitData.lastModified.get(entry.path);

    const baseFields = {
      id: entry.path,
      name: entry.name,
      path: entry.path,
      extension: entry.extension,
      sizeBytes: entry.sizeBytes,
      gitCommitCount: commits || undefined,
      gitLastModified: lastMod,
      gitRecentActivity: recent || undefined,
      parentId: entry.parentPath,
      depth: entry.depth,
      gridX: 0,
      gridY: 0,
    };

    if (entry.type === "file") {
      const language = getLanguage(entry.extension ?? "", entry.name);
      const normalizedSize = (entry.sizeBytes ?? 0) / maxSize;
      const normalizedCommits = commits / maxCommits;
      const importance = Math.max(
        0.05,
        0.4 * normalizedSize + 0.6 * normalizedCommits
      );

      return {
        ...baseFields,
        type: "file",
        language,
        importance,
        sprite: [],
        labelSprite: [],
        spriteWidth: 0,
        spriteHeight: 0,
      };
    }

    return {
      ...baseFields,
      type: "folder",
      importance: 0,
      children: [],
      gridCols: 0,
      gridRows: 0,
      labelSprite: [],
      labelOffsetX: 0,
      labelOffsetY: 0,
    };
  });
}
