import { getLanguage, getColor } from "@beadspace/shared";
import type { RawFileEntry, BeadNode } from "@beadspace/shared";
import type { GitData } from "./git-analyzer.js";

export function enrichEntries(
  entries: RawFileEntry[],
  gitData: GitData
): BeadNode[] {
  const maxCommits = Math.max(1, ...gitData.commitCounts.values());
  const maxRecent = Math.max(1, ...gitData.recentActivity.values());
  const maxSize = Math.max(
    1,
    ...entries
      .filter((e) => e.type === "file")
      .map((e) => e.sizeBytes ?? 0)
  );

  return entries.map((entry) => {
    const language =
      entry.type === "file"
        ? getLanguage(entry.extension ?? "", entry.name)
        : undefined;
    const color = language ? getColor(language) : "#444444";

    const commits = gitData.commitCounts.get(entry.path) ?? 0;
    const recent = gitData.recentActivity.get(entry.path) ?? 0;
    const lastMod = gitData.lastModified.get(entry.path);

    const normalizedSize = (entry.sizeBytes ?? 0) / maxSize;
    const normalizedCommits = commits / maxCommits;
    const brightness =
      gitData.recentActivity.size > 0
        ? Math.min(1, recent / maxRecent)
        : 0.6;
    const importance =
      entry.type === "folder"
        ? 0
        : 0.4 * normalizedSize + 0.6 * normalizedCommits;

    return {
      id: entry.path,
      name: entry.name,
      path: entry.path,
      type: entry.type,
      language,
      extension: entry.extension,
      sizeBytes: entry.sizeBytes,
      gitCommitCount: commits || undefined,
      gitLastModified: lastMod,
      gitRecentActivity: recent || undefined,
      parentId: entry.parentPath,
      children: undefined,
      depth: entry.depth,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      color,
      brightness: Math.max(0.15, brightness),
      importance: Math.max(0.05, importance),
    };
  });
}
