import type { BeadNode } from "@beadspace/shared";
import { getPastelHex } from "../renderer/bead-node.js";

const card = document.getElementById("detail-card") as HTMLDivElement;
const backdrop = document.getElementById("detail-card-backdrop") as HTMLDivElement;
const cardBead = card.querySelector(".card-bead") as HTMLDivElement;
const cardTitle = card.querySelector(".card-title") as HTMLDivElement;
const cardPath = card.querySelector(".card-path") as HTMLDivElement;
const cardRows = document.getElementById("card-rows") as HTMLDivElement;

export function showDetailCard(node: BeadNode): void {
  const color = getPastelHex(node.language);
  cardBead.style.background = color;
  cardTitle.textContent = node.name;
  cardPath.textContent = node.path;

  const rows: [string, string][] = [];

  if (node.language && node.language !== "unknown") {
    rows.push(["Language", node.language]);
  }
  rows.push(["Type", node.type]);
  if (node.sizeBytes !== undefined) {
    rows.push([
      "Size",
      node.sizeBytes > 1024
        ? `${(node.sizeBytes / 1024).toFixed(1)} KB`
        : `${node.sizeBytes} B`,
    ]);
  }
  if (node.gitCommitCount) {
    rows.push(["Total Commits", String(node.gitCommitCount)]);
  }
  if (node.gitRecentActivity) {
    rows.push(["Recent (30d)", String(node.gitRecentActivity)]);
  }
  if (node.gitLastModified) {
    rows.push(["Last Modified", new Date(node.gitLastModified).toLocaleDateString()]);
  }
  rows.push(["Brightness", `${(node.brightness * 100).toFixed(0)}%`]);
  rows.push(["Importance", `${(node.importance * 100).toFixed(0)}%`]);

  cardRows.innerHTML = rows
    .map(([label, value]) =>
      `<div class="card-row"><span class="card-label">${label}</span><span class="card-value">${value}</span></div>`
    )
    .join("");

  card.classList.add("visible");
  backdrop.classList.add("visible");
}
