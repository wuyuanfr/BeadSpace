import * as PIXI from "pixi.js";

const MIN_SCALE = 0.05;
const MAX_SCALE = 6;

let canvasRef: HTMLCanvasElement | null = null;
let worldRef: PIXI.Container | null = null;
let dragging = false;
let lastX = 0;
let lastY = 0;
let panEnabled = true;

export function setupViewport(
  app: PIXI.Application,
  world: PIXI.Container
): void {
  canvasRef = app.canvas as HTMLCanvasElement;
  worldRef = world;
  canvasRef.style.cursor = "grab";

  canvasRef.addEventListener("wheel", onWheel, { passive: false });
  canvasRef.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
}

export function setViewportPanEnabled(v: boolean): void {
  panEnabled = v;
  if (canvasRef) canvasRef.style.cursor = v ? "grab" : "crosshair";
}

function onWheel(e: WheelEvent) {
  if (!worldRef || !canvasRef) return;
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.92 : 1.08;
  const newScale = Math.max(
    MIN_SCALE,
    Math.min(MAX_SCALE, worldRef.scale.x * factor)
  );
  const rect = canvasRef.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const wx = (mx - worldRef.x) / worldRef.scale.x;
  const wy = (my - worldRef.y) / worldRef.scale.y;
  worldRef.scale.set(newScale);
  worldRef.x = mx - wx * newScale;
  worldRef.y = my - wy * newScale;
}

function onPointerDown(e: PointerEvent) {
  if (!canvasRef) return;
  // Middle click always pans; left click only when pan enabled
  if (e.button === 1 || (e.button === 0 && panEnabled)) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvasRef.style.cursor = "grabbing";
  }
}

function onPointerMove(e: PointerEvent) {
  if (!dragging || !worldRef) return;
  worldRef.x += e.clientX - lastX;
  worldRef.y += e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
}

function onPointerUp() {
  if (dragging) {
    dragging = false;
    if (canvasRef) canvasRef.style.cursor = panEnabled ? "grab" : "crosshair";
  }
}
