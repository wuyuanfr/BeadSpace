import { getPerlerColor, perlerHex, PERLER_NAME } from "@beadspace/shared";
import type { FileBeadNode } from "@beadspace/shared";
import { formatBytes } from "../util/format.js";

const card = document.getElementById("detail-card") as HTMLDivElement;
const backdrop = document.getElementById("detail-card-backdrop") as HTMLDivElement;
const cardBead = card.querySelector(".card-bead") as HTMLDivElement;
const cardTitle = card.querySelector(".card-title") as HTMLDivElement;
const cardPath = card.querySelector(".card-path") as HTMLDivElement;
const cardRows = document.getElementById("card-rows") as HTMLDivElement;
const closeBtn = card.querySelector(".card-close") as HTMLButtonElement;

export function showDetailCard(node: FileBeadNode): void {
  const perler = getPerlerColor(node.language ?? "unknown");
  cardBead.style.background = perlerHex(perler);
  cardTitle.textContent = node.name;
  cardPath.textContent = node.path;

  const rows: [string, string][] = [];
  if (node.language && node.language !== "unknown") rows.push(["Language", node.language]);
  rows.push(["Bead Color", PERLER_NAME[perler]]);
  if (node.sizeBytes !== undefined) rows.push(["Size", formatBytes(node.sizeBytes)]);
  if (node.gitCommitCount) rows.push(["Total Commits", String(node.gitCommitCount)]);
  if (node.gitRecentActivity) rows.push(["Recent (30d)", String(node.gitRecentActivity)]);
  if (node.gitLastModified) rows.push(["Last Modified", new Date(node.gitLastModified).toLocaleDateString()]);
  rows.push(["Importance", `${(node.importance * 100).toFixed(0)}%`]);
  rows.push(["Bead Count", String(node.sprite.length)]);

  cardRows.innerHTML = rows
    .map(
      ([label, value]) =>
        `<div class="card-row"><span class="card-label">${label}</span><span class="card-value">${value}</span></div>`
    )
    .join("");

  card.classList.add("visible");
  backdrop.classList.add("visible");
}

export function hideDetailCard(): void {
  card.classList.remove("visible");
  backdrop.classList.remove("visible");
}

closeBtn.addEventListener("click", hideDetailCard);
backdrop.addEventListener("click", hideDetailCard);
