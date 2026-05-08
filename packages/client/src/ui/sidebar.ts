import { getPerlerColor, perlerHex, PERLER_NAME } from "@beadspace/shared";

const legendList = document.getElementById("legend-list") as HTMLDivElement;

export function updateLegend(languages: Record<string, number>): void {
  const sorted = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  legendList.innerHTML = sorted
    .slice(0, 14)
    .map(([lang, count]) => {
      const perler = getPerlerColor(lang);
      const swatch = perlerHex(perler);
      return `<div class="legend-row">
        <span class="legend-bead" style="background:${swatch}"></span>
        <span class="legend-lang">${lang}</span>
        <span class="legend-perler">${PERLER_NAME[perler]}</span>
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
