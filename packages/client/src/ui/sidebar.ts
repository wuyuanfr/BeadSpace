import type { BeadNode } from "@beadspace/shared";

const sidebar = document.getElementById("sidebar") as HTMLDivElement;
const content = document.getElementById("sidebar-content") as HTMLDivElement;
const closeBtn = sidebar.querySelector(".close-btn") as HTMLButtonElement;

closeBtn.addEventListener("click", () => {
  sidebar.style.display = "none";
});

export function showSidebar(node: BeadNode): void {
  const rows: [string, string][] = [
    ["Path", node.path],
    ["Type", node.type],
  ];

  if (node.language && node.language !== "unknown") {
    rows.push(["Language", node.language]);
  }
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
    rows.push(["Recent Activity (30d)", String(node.gitRecentActivity)]);
  }
  if (node.gitLastModified) {
    rows.push([
      "Last Modified",
      new Date(node.gitLastModified).toLocaleDateString(),
    ]);
  }
  if (node.gitAuthors && node.gitAuthors.length > 0) {
    rows.push(["Authors", node.gitAuthors.join(", ")]);
  }
  rows.push(["Brightness", `${(node.brightness * 100).toFixed(0)}%`]);
  rows.push(["Importance", `${(node.importance * 100).toFixed(0)}%`]);

  content.innerHTML = rows
    .map(
      ([label, value]) =>
        `<div class="detail-row">
          <span class="detail-label">${label}</span>
          <span class="detail-value">${value}</span>
        </div>`
    )
    .join("");

  sidebar.style.display = "block";
}
