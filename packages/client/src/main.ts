import type { WorkspaceGraph } from "@beadspace/shared";
import { LANGUAGE_COLORS } from "@beadspace/shared";
import { BeadSpaceApp } from "./renderer/app.js";

const pathInput = document.getElementById("path-input") as HTMLInputElement;
const scanBtn = document.getElementById("scan-btn") as HTMLButtonElement;
const status = document.getElementById("status") as HTMLSpanElement;
const container = document.getElementById("canvas-container") as HTMLDivElement;
const legend = document.getElementById("legend") as HTMLDivElement;

let app: BeadSpaceApp | null = null;

async function scan() {
  const targetPath = pathInput.value.trim();
  if (!targetPath) return;

  scanBtn.disabled = true;
  status.textContent = "Scanning...";

  try {
    const res = await fetch(
      `/api/workspace?path=${encodeURIComponent(targetPath)}`
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }

    const graph: WorkspaceGraph = await res.json();
    status.textContent = `${graph.metadata.totalFiles} files, ${graph.metadata.totalFolders} folders`;

    if (!app) {
      app = new BeadSpaceApp();
      await app.init(container);
    }

    app.renderGraph(graph);
    renderLegend(graph.metadata.languages);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    status.textContent = `Error: ${msg}`;
  } finally {
    scanBtn.disabled = false;
  }
}

function renderLegend(languages: Record<string, number>) {
  const sorted = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  legend.innerHTML = sorted
    .slice(0, 10)
    .map(([lang, count]) => {
      const color = LANGUAGE_COLORS[lang] ?? "#888";
      return `<div class="legend-item">
        <div class="legend-dot" style="background:${color}"></div>
        ${lang} (${count})
      </div>`;
    })
    .join("");
}

scanBtn.addEventListener("click", scan);
pathInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") scan();
});
