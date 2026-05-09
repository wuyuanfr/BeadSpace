import type { WorkspaceGraph } from "@beadspace/shared";
import { BeadSpaceApp } from "./renderer/app.js";
import { updateLegend } from "./ui/sidebar.js";
import { updateBottomBar } from "./ui/bottom-bar.js";
import { openFolderPicker } from "./ui/folder-picker.js";

const pathInput = document.getElementById("path-input") as HTMLInputElement;
const browseBtn = document.getElementById("browse-btn") as HTMLButtonElement;
const scanBtn = document.getElementById("scan-btn") as HTMLButtonElement;
const ironBtn = document.getElementById("iron-btn") as HTMLButtonElement;
const brushSlider = document.getElementById("brush-slider") as HTMLInputElement;
const brushValue = document.getElementById("brush-value") as HTMLSpanElement;
const container = document.getElementById("canvas-container") as HTMLDivElement;
const sidebar = document.getElementById("left-sidebar") as HTMLElement;
const scanOverlay = document.getElementById("scan-overlay") as HTMLDivElement;
const scanStatusText = document.getElementById("scan-status-text") as HTMLDivElement;
const allColdBtn = document.getElementById("all-cold-btn") as HTMLButtonElement;
const allFusedBtn = document.getElementById("all-fused-btn") as HTMLButtonElement;
const resetBoardBtn = document.getElementById("reset-board-btn") as HTMLButtonElement;

let app: BeadSpaceApp | null = null;

const scanMessages = [
  "Discovering files...",
  "Reading workspace structure...",
  "Choosing perler colors...",
  "Building pegboards...",
  "Dropping beads onto pins...",
];

function showScanAnimation(): () => void {
  scanOverlay.classList.add("active");
  let idx = 0;
  scanStatusText.textContent = scanMessages[0];
  const interval = setInterval(() => {
    idx = (idx + 1) % scanMessages.length;
    scanStatusText.textContent = scanMessages[idx];
  }, 600);
  return () => {
    clearInterval(interval);
    scanOverlay.classList.remove("active");
  };
}

async function scan() {
  const targetPath = pathInput.value.trim();
  if (!targetPath) return;

  scanBtn.disabled = true;
  const dismiss = showScanAnimation();

  try {
    const res = await fetch(
      `/api/workspace?path=${encodeURIComponent(targetPath)}`
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }

    const graph: WorkspaceGraph = await res.json();

    await new Promise((r) => setTimeout(r, 800));
    dismiss();

    sidebar.classList.add("visible");
    container.classList.add("with-sidebar");
    updateLegend(graph.metadata.languages);
    updateBottomBar(graph);

    await new Promise((r) => requestAnimationFrame(r));

    if (!app) {
      app = new BeadSpaceApp();
      await app.init(container);
    }

    app.resize();
    app.renderGraph(graph);
  } catch (err: unknown) {
    dismiss();
    const msg = err instanceof Error ? err.message : "Unknown error";
    scanStatusText.textContent = `Error: ${msg}`;
    scanOverlay.classList.add("active");
    setTimeout(() => scanOverlay.classList.remove("active"), 2200);
  } finally {
    scanBtn.disabled = false;
  }
}

scanBtn.addEventListener("click", scan);
pathInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") scan();
});
browseBtn.addEventListener("click", () => {
  openFolderPicker(pathInput.value.trim(), (selected) => {
    pathInput.value = selected;
  });
});

ironBtn.addEventListener("click", () => {
  if (!app) return;
  const newActive = !app.ironTool.isActive();
  app.ironTool.setActive(newActive);
  ironBtn.classList.toggle("active", newActive);
});

brushSlider.addEventListener("input", () => {
  if (!app) return;
  const r = parseInt(brushSlider.value, 10);
  app.ironTool.setBrushRadius(r);
  brushValue.textContent = String(r);
});

allColdBtn.addEventListener("click", () => app?.setAllCold());
allFusedBtn.addEventListener("click", () => app?.setAllFused());
resetBoardBtn.addEventListener("click", () => app?.resetBoard());
