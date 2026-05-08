import { getPastelHex } from "../renderer/bead-node.js";

const legendList = document.getElementById("legend-list") as HTMLDivElement;

export function updateLegend(languages: Record<string, number>): void {
  const sorted = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  legendList.innerHTML = sorted
    .slice(0, 12)
    .map(([lang, count]) => {
      const color = getPastelHex(lang);
      return `<div class="legend-row">
        <span class="legend-bead" style="background:${color}"></span>
        <span>${lang}</span>
        <span class="legend-count">${count}</span>
      </div>`;
    })
    .join("");
}

export function showSidebar(): void {
  document.getElementById("left-sidebar")!.classList.add("visible");
}

export function hideSidebar(): void {
  document.getElementById("left-sidebar")!.classList.remove("visible");
}
