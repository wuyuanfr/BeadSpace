import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

export interface GitData {
  commitCounts: Map<string, number>;
  recentActivity: Map<string, number>;
  lastModified: Map<string, string>;
}

async function isGitRepo(dir: string): Promise<boolean> {
  try {
    await fs.access(path.join(dir, ".git"));
    return true;
  } catch {
    return false;
  }
}

async function runGit(
  cwd: string,
  args: string[]
): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout;
  } catch {
    return "";
  }
}

function parseNameCount(output: string): Map<string, number> {
  const map = new Map<string, number>();
  const lines = output.trim().split("\n").filter(Boolean);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const spaceIdx = trimmed.indexOf(" ");
    if (spaceIdx === -1) continue;
    const count = parseInt(trimmed.slice(0, spaceIdx), 10);
    const filePath = trimmed.slice(spaceIdx + 1).trim();
    if (filePath && !isNaN(count)) {
      map.set(filePath.replace(/\\/g, "/"), count);
    }
  }
  return map;
}

export async function analyzeGit(rootPath: string): Promise<GitData> {
  const empty: GitData = {
    commitCounts: new Map(),
    recentActivity: new Map(),
    lastModified: new Map(),
  };

  if (!(await isGitRepo(rootPath))) return empty;

  const [allOutput, recentOutput, logOutput] = await Promise.all([
    runGit(rootPath, [
      "log",
      "--format=format:",
      "--name-only",
      "--diff-filter=ACDMR",
    ]),
    runGit(rootPath, [
      "log",
      "--since=30 days ago",
      "--format=format:",
      "--name-only",
      "--diff-filter=ACDMR",
    ]),
    runGit(rootPath, ["log", "--format=%aI", "--name-only"]),
  ]);

  // Count occurrences per file for total commits
  const commitCounts = new Map<string, number>();
  for (const line of allOutput.split("\n")) {
    const f = line.trim();
    if (f) {
      const normalized = f.replace(/\\/g, "/");
      commitCounts.set(normalized, (commitCounts.get(normalized) ?? 0) + 1);
    }
  }

  // Count occurrences per file for recent activity
  const recentActivity = new Map<string, number>();
  for (const line of recentOutput.split("\n")) {
    const f = line.trim();
    if (f) {
      const normalized = f.replace(/\\/g, "/");
      recentActivity.set(
        normalized,
        (recentActivity.get(normalized) ?? 0) + 1
      );
    }
  }

  // Parse last modified dates
  const lastModified = new Map<string, string>();
  let currentDate = "";
  for (const line of logOutput.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}T/)) {
      currentDate = trimmed;
    } else if (currentDate && !lastModified.has(trimmed.replace(/\\/g, "/"))) {
      lastModified.set(trimmed.replace(/\\/g, "/"), currentDate);
    }
  }

  return { commitCounts, recentActivity, lastModified };
}
