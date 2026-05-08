interface BrowseEntry {
  name: string;
  path: string;
}

interface BrowseResponse {
  path: string;
  parent: string | null;
  entries: BrowseEntry[];
}

const modal = document.getElementById("folder-picker") as HTMLDivElement;
const backdrop = document.getElementById("folder-picker-backdrop") as HTMLDivElement;
const pathDisplay = document.getElementById("folder-picker-path") as HTMLDivElement;
const upBtn = document.getElementById("folder-picker-up") as HTMLButtonElement;
const list = document.getElementById("folder-picker-list") as HTMLDivElement;
const cancelBtn = document.getElementById("folder-picker-cancel") as HTMLButtonElement;
const selectBtn = document.getElementById("folder-picker-select") as HTMLButtonElement;

let currentPath = "";
let currentParent: string | null = null;
let onSelect: ((path: string) => void) | null = null;

async function loadDir(path: string): Promise<void> {
  try {
    let resolvedPath = path;
    if (!resolvedPath) {
      const homeRes = await fetch("/api/browse-home");
      if (!homeRes.ok) throw new Error(`HTTP ${homeRes.status}`);
      const home: { path: string } = await homeRes.json();
      resolvedPath = home.path;
    }
    const res = await fetch(`/api/browse?path=${encodeURIComponent(resolvedPath)}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    const data: BrowseResponse = await res.json();
    currentPath = data.path;
    currentParent = data.parent;
    pathDisplay.textContent = data.path;
    upBtn.disabled = data.parent === null;

    list.innerHTML = data.entries
      .map(
        (e) => `<div class="picker-row" data-path="${escapeHtml(e.path)}">
          <span class="picker-icon">📁</span>
          <span class="picker-name">${escapeHtml(e.name)}</span>
        </div>`
      )
      .join("");

    list.querySelectorAll(".picker-row").forEach((row) => {
      row.addEventListener("dblclick", () => {
        const p = (row as HTMLElement).dataset.path;
        if (p) loadDir(p);
      });
      row.addEventListener("click", () => {
        list.querySelectorAll(".picker-row").forEach((r) => r.classList.remove("selected"));
        row.classList.add("selected");
      });
    });
  } catch (err) {
    list.innerHTML = `<div class="picker-error">${escapeHtml(
      err instanceof Error ? err.message : "Failed to load directory"
    )}</div>`;
  }
}

export function openFolderPicker(
  startPath: string,
  cb: (path: string) => void
): void {
  onSelect = cb;
  modal.classList.add("visible");
  backdrop.classList.add("visible");
  loadDir(startPath);
}

function close() {
  modal.classList.remove("visible");
  backdrop.classList.remove("visible");
  onSelect = null;
}

upBtn.addEventListener("click", () => {
  if (currentParent) loadDir(currentParent);
});

cancelBtn.addEventListener("click", close);
backdrop.addEventListener("click", close);
selectBtn.addEventListener("click", () => {
  if (currentPath && onSelect) {
    onSelect(currentPath);
    close();
  }
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]!));
}
