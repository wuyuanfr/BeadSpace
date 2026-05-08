import type { WorkspaceGraph } from "@beadspace/shared";
import { BeadSpaceApp } from "./renderer/app.js";
import { updateLegend, showSidebar, hideSidebar } from "./ui/sidebar.js";
import { updateBottomBar } from "./ui/bottom-bar.js";

const pathInput = document.getElementById("path-input") as HTMLInputElement;
const scanBtn = document.getElementById("scan-btn") as HTMLButtonElement;
const regenBtn = document.getElementById("regen-btn") as HTMLButtonElement;
const container = document.getElementById("canvas-container") as HTMLDivElement;
const sidebar = document.getElementById("left-sidebar") as HTMLElement;
const scanOverlay = document.getElementById("scan-overlay") as HTMLDivElement;
const scanStatusText = document.getElementById("scan-status-text") as HTMLDivElement;

let app: BeadSpaceApp | null = null;
let lastGraph: WorkspaceGraph | null = null;

const scanMessages = [
  "Discovering files...",
  "Reading workspace structure...",
  "Generating Bead Forest...",
  "Building Dataset Desert...",
  "Constructing Documentation Temple...",
  "Assembling bead world...",
];

function showScanAnimation(): Promise<void> {
  scanOverlay.classList.add("active");
  let idx = 0;
  const interval = setInterval(() => {
    idx = (idx + 1) % scanMessages.length;
    scanStatusText.textContent = scanMessages[idx];
  }, 600);
  return new Promise((resolve) => {
    (scanOverlay as any)._cleanup = () => {
      clearInterval(interval);
      scanOverlay.classList.remove("active");
      resolve();
    };
  });
}

function hideScanAnimation() {
  const cleanup = (scanOverlay as any)._cleanup;
  if (cleanup) cleanup();
}

async function scan() {
  const targetPath = pathInput.value.trim();
  if (!targetPath) return;

  scanBtn.disabled = true;
  const animDone = showScanAnimation();

  try {
    const res = await fetch(
      `/api/workspace?path=${encodeURIComponent(targetPath)}`
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }

    const graph: WorkspaceGraph = await res.json();
    lastGraph = graph;

    // Ensure minimum scan animation time for UX
    await new Promise((r) => setTimeout(r, 1200));
    hideScanAnimation();

    // Show sidebar first so container dimensions are correct
    sidebar.classList.add("visible");
    container.classList.add("with-sidebar");
    updateLegend(graph.metadata.languages);
    updateBottomBar(graph);
    initLayerToggles();

    // Wait a frame for layout to settle
    await new Promise((r) => requestAnimationFrame(r));

    if (!app) {
      app = new BeadSpaceApp();
      await app.init(container);
    }

    app.resize();
    app.renderGraph(graph);
  } catch (err: unknown) {
    hideScanAnimation();
    const msg = err instanceof Error ? err.message : "Unknown error";
    scanStatusText.textContent = `Error: ${msg}`;
    scanOverlay.classList.add("active");
    setTimeout(() => scanOverlay.classList.remove("active"), 2000);
  } finally {
    scanBtn.disabled = false;
  }
}

function initLayerToggles() {
  const togglesContainer = document.getElementById("layer-toggles")!;
  const layers = [
    { name: "Folders", color: "#A8D5BA", key: "folders" },
    { name: "Git Activity", color: "#FFB7B2", key: "git" },
    { name: "File Labels", color: "#9BC7F7", key: "labels" },
  ];

  togglesContainer.innerHTML = layers
    .map(
      (l) => `
    <div class="layer-toggle" data-layer="${l.key}">
      <span><span class="dot" style="background:${l.color}"></span>${l.name}</span>
      <div class="toggle-switch on" data-layer="${l.key}"></div>
    </div>
  `
    )
    .join("");

  togglesContainer.querySelectorAll(".toggle-switch").forEach((sw) => {
    sw.addEventListener("click", () => {
      sw.classList.toggle("on");
      const layer = (sw as HTMLElement).dataset.layer!;
      app?.toggleLayer(layer, sw.classList.contains("on"));
    });
  });
}

// Theme cards
document.querySelectorAll(".theme-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".theme-card").forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
  });
});

scanBtn.addEventListener("click", scan);
regenBtn.addEventListener("click", () => {
  if (lastGraph && app) {
    app.renderGraph(lastGraph);
  }
});
pathInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") scan();
});

// Close detail card
document.querySelector("#detail-card .card-close")!.addEventListener("click", () => {
  document.getElementById("detail-card")!.classList.remove("visible");
  document.getElementById("detail-card-backdrop")!.classList.remove("visible");
});
document.getElementById("detail-card-backdrop")!.addEventListener("click", () => {
  document.getElementById("detail-card")!.classList.remove("visible");
  document.getElementById("detail-card-backdrop")!.classList.remove("visible");
});
