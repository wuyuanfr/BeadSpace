import type { WorkspaceGraph } from "@beadspace/shared";

const bottomMood = document.getElementById("bottom-mood") as HTMLSpanElement;
const bottomStructures = document.getElementById("bottom-structures") as HTMLSpanElement;
const bottomRegions = document.getElementById("bottom-regions") as HTMLSpanElement;
const bottomEnergy = document.getElementById("bottom-energy") as HTMLSpanElement;

export function updateBottomBar(graph: WorkspaceGraph): void {
  const { totalFiles, totalFolders, languages } = graph.metadata;
  const langCount = Object.keys(languages).length;

  // Compute commit energy
  let totalRecent = 0;
  for (const node of graph.nodes) {
    if (node.gitRecentActivity) totalRecent += node.gitRecentActivity;
  }
  const energy =
    totalRecent === 0
      ? "Calm"
      : totalRecent < 20
        ? "Low"
        : totalRecent < 50
          ? "Medium"
          : totalRecent < 100
            ? "High"
            : "Intense";

  const mood =
    totalFiles < 20
      ? "Cozy Notebook"
      : totalFiles < 100
        ? "Calm Productivity"
        : totalFiles < 500
          ? "Busy Workshop"
          : "Sprawling City";

  bottomMood.textContent = `Mood: ${mood}`;
  bottomStructures.textContent = `Structures: ${totalFiles}`;
  bottomRegions.textContent = `Regions: ${totalFolders} · ${langCount} langs`;
  bottomEnergy.textContent = `Commit Energy: ${energy}`;
}
