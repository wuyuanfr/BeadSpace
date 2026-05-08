import type { BeadNode } from "@beadspace/shared";

const tooltip = document.getElementById("tooltip") as HTMLDivElement;
const ttName = tooltip.querySelector(".tt-name") as HTMLDivElement;
const ttMeta = tooltip.querySelector(".tt-meta") as HTMLDivElement;

export function showTooltip(node: BeadNode, x: number, y: number): void {
  const sizeStr = node.sizeBytes
    ? node.sizeBytes > 1024
      ? `${(node.sizeBytes / 1024).toFixed(1)} KB`
      : `${node.sizeBytes} B`
    : "";

  const parts: string[] = [];
  if (node.language && node.language !== "unknown") {
    parts.push(
      `<span class="tt-color" style="background:${node.color}"></span>${node.language}`
    );
  }
  if (sizeStr) parts.push(sizeStr);
  if (node.gitCommitCount) parts.push(`${node.gitCommitCount} commits`);
  if (node.gitRecentActivity)
    parts.push(`${node.gitRecentActivity} recent`);

  ttName.textContent = node.path;
  ttMeta.innerHTML = parts.join(" &middot; ");

  tooltip.style.display = "block";
  tooltip.style.left = `${x + 12}px`;
  tooltip.style.top = `${y + 12}px`;

  // Keep tooltip on screen
  const rect = tooltip.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    tooltip.style.left = `${x - rect.width - 12}px`;
  }
  if (rect.bottom > window.innerHeight) {
    tooltip.style.top = `${y - rect.height - 12}px`;
  }
}

export function hideTooltip(): void {
  tooltip.style.display = "none";
}
