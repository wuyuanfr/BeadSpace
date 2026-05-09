import { perlerHex, getPerlerColor } from "@beadspace/shared";
import type { FileBeadNode } from "@beadspace/shared";
import { formatBytes } from "../util/format.js";

const tooltip = document.getElementById("tooltip") as HTMLDivElement;
const ttBeadIcon = tooltip.querySelector(".tt-bead-icon") as HTMLSpanElement;
const ttFilename = tooltip.querySelector(".tt-filename") as HTMLSpanElement;
const ttMeta = tooltip.querySelector(".tt-meta") as HTMLDivElement;

export function showTooltip(node: FileBeadNode, x: number, y: number): void {
  const color = perlerHex(getPerlerColor(node.language ?? "unknown"));
  ttBeadIcon.style.background = color;
  ttFilename.textContent = node.name;

  const rows: string[] = [];
  if (node.language && node.language !== "unknown") {
    rows.push(`<div class="tt-row"><span class="tt-label">Language</span><span class="tt-value">${node.language}</span></div>`);
  }
  if (node.sizeBytes) {
    rows.push(`<div class="tt-row"><span class="tt-label">Size</span><span class="tt-value">${formatBytes(node.sizeBytes)}</span></div>`);
  }
  if (node.gitCommitCount) {
    rows.push(`<div class="tt-row"><span class="tt-label">Commits</span><span class="tt-value">${node.gitCommitCount}</span></div>`);
  }
  if (node.gitLastModified) {
    rows.push(`<div class="tt-row"><span class="tt-label">Modified</span><span class="tt-value">${getTimeAgo(node.gitLastModified)}</span></div>`);
  }

  ttMeta.innerHTML = rows.join("");
  tooltip.style.display = "block";
  tooltip.style.left = `${x + 16}px`;
  tooltip.style.top = `${y + 16}px`;

  const rect = tooltip.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    tooltip.style.left = `${x - rect.width - 16}px`;
  }
  if (rect.bottom > window.innerHeight) {
    tooltip.style.top = `${y - rect.height - 16}px`;
  }
}

export function hideTooltip(): void {
  tooltip.style.display = "none";
}

function getTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
