import * as PIXI from "pixi.js";

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

export function setupViewport(
  app: PIXI.Application,
  world: PIXI.Container
): void {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const canvas = app.canvas as HTMLCanvasElement;

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, world.scale.x * delta)
    );

    // Zoom toward cursor position
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - world.x) / world.scale.x;
    const worldY = (mouseY - world.y) / world.scale.y;

    world.scale.set(newScale);
    world.x = mouseX - worldX * newScale;
    world.y = mouseY - worldY * newScale;
  }, { passive: false });

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button === 0 || e.button === 1) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = "grabbing";
    }
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    world.x += dx;
    world.y += dy;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
    canvas.style.cursor = "default";
  });
}
