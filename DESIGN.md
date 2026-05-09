# BeadSpace — Next-Level Design

Living design doc evolving BeadSpace beyond the MVP captured in `MVP Implementation Plan.md`. New ideas land in **Inbox**, get refined, and migrate into the **Synthesis** sections. Decisions that resolve open questions land back in synthesis prose; the **Open questions** list only carries unresolved ones.

**Reference:** `initial.md` · `UI_design.md` · `MVP Implementation Plan.md` · `CLAUDE.md` · `README.md`

---

## Inbox

*Raw, unintegrated ideas — newest first.*

### 2026-05-08 — Folder picker via native browser

The current path input expects a typed absolute path. Add a **"Browse" button** that opens a folder picker. In a browser context this is constrained: a server endpoint lists directory entries on demand and the client renders a modal navigator (default starting point: server's home directory). On Tauri/Electron later, this can be replaced with a native dialog.

→ Adds a new server endpoint and a client modal. Doesn't affect the bead overhaul.

### 2026-05-08 — User-only ironing (no auto pass)

No automatic iron pass after the scan. Beads spawn **cold** (rings on pins). The user is the one who irons — full agency. Drops `initialTemperature` and the warm-front animation step. Closes two open questions: auto-iron → user-only; brightness overlay → dropped (no semantic overlay tied to git in v1).

### 2026-05-08 — White-bead background fill

Empty space inside each board is filled with **white beads** (perler standard "white"). Every pin has a bead — colored where files/labels are, white otherwise.

### 2026-05-08 — Everything is a bead, including labels

File and folder labels are **bead patterns generated from a pixel font**, not text. Dark beads on the white-bead background.

### 2026-05-08 — Interactive iron / steam tool

A user brush tool. Pressing it onto the canvas heats beads — temperature accumulates per bead. Higher temperature → swelling → fusion above threshold → adjacent same-color merging.

### 2026-05-08 — The fusing step

Iron / steam pass melts beads: rings swell into filled cells; gaps between adjacent beads fill in. Establishes the two-state visual (cold ring ↔ fused filled cell) that the iron tool drives.

### 2026-05-08 — Visual specifics

Pin grid background; thick rings as beads; large file = disk of many rings; medium = pixel/voxel art with the ring-on-pin as the unit.

### 2026-05-08 — "Bead" = real perler/fuse beads (foundational)

Plastic hollow cylinders on a pegboard, all **same size**, drawn from a fixed **standard color palette** (Perler / Hama).

---

## Synthesis

### 1. Core metaphor & product framing

_(no entries yet)_

### 2. Aesthetic & interaction

#### Authentic perler-bead constraints

Beads are *physical* perler/fuse beads — not generic pixels, not rounded rectangles. The medium constrains everything that appears in the world:

- **Thick ring on a pin (cold state).** Top-down render of each freshly-placed bead is a thick annulus (ring) sitting on a pin of the pegboard. The ring silhouette **is** the bead — the inside of the ring shows the pin (or the board) through it.
- **Filled cell (hot / fused state).** As the user heats a bead with the iron tool it **swells** progressively. Outer radius pushes outward, inner hole shrinks. Above a fuse threshold the hole closes and adjacent same-color beads merge their geometry, filling the gaps. Reads as pixel art, not as discrete rings.
- **Temperature drives the transition.** Each bead carries a temperature value (0..1). Rendering interpolates ring → filled radii smoothly. A latched **`fused`** flag flips once temperature crosses the threshold and enables same-color merging from then on.
- **Pin grid as substrate.** The pegboard's pin grid is the structural skeleton of every region. Pins are visible inside unfused ring centers; once a bead fuses, its center fills and that pin disappears.
- **Uniform size.** Every bead has the same dimensions. File importance, size, or activity travel via bead *count*, sprite shape, stacking, or placement — never bead size.
- **Standard named palette.** Colors come from a real perler color line (~50–60 named colors). Linguist hex is mapped to a named perler color; arbitrary hex is off-medium.
- **Every pin has a bead.** Empty space inside a board is filled with **white beads** (perler standard "white"). The board is a fully populated bead artwork — file sprites are colored regions punched into a white-bead expanse. Once fused, white beads merge into one continuous white field with file sprites as colored islands.
- **Labels are beads too.** File and folder labels are **bead patterns generated from a pixel font** (typically dark beads on the white-bead background). They occupy real cells on the pegboard.
- **Composition.** A *file* is a sprite of multiple beads. **Default sprite = a disk of rings**, sized by importance (radius scales with importance ⇒ ring count grows). Special files (README → landmark/monument, Dockerfile → island marker, tests → arena tile, etc., per `UI_design.md` §8) override the default with role-specific templates.
- **Stylistic frame.** The medium is **pixel/voxel art with the ring-on-pin as the base unit**. The slight isometric tilt in `UI_design.md` §7 reads as voxel-style depth on the rings, supporting multi-layer stacks for landmarks (towers, monuments).

#### Scan animation (cold beads, no auto-iron)

1. **Boards form** — pegboard rectangles materialize at their world positions; pin grids fade in.
2. **Beads drop** — file sprites + label sprites + white-bead fill cascade onto pins as **cold rings**, color by language.
3. **Hand off to user** — the world is now a fully-populated cold bead board. The user picks up the iron tool and heats wherever they want.

### 3. Data model

#### Sprite-on-grid primitives

Implications for `BeadNode`:

- File layout becomes a **sprite on a pegboard grid**, not an arbitrary `(x, y, width, height)` rect.
- File-node fields:
  - `gridX`, `gridY` — top-left pin of the sprite within the parent folder's pegboard
  - `sprite: BeadCell[]` where `BeadCell = { dx, dy, color: PerlerColor, layer?: number }`
  - File "footprint" (sprite cell count) replaces `width × height` as the importance channel
- `color` for files isn't on the node — it lives on each `BeadCell`. `PerlerColor` is a named enum (~50–60 colors).
- Folder-node fields keep world-space `(x, y, width, height)` plus grid dimensions (`gridCols`, `gridRows`).
- Folder regions are **bottom-up sized**: a folder's grid dimensions are derived from the total cells it must hold (children's sprite footprints + label slots + margin); world-space `(width, height)` follows from grid × pin spacing.
- Sprite assignment:
  - **Default** — `disk` template; radius from importance ⇒ ring count grows with importance.
  - **Role overrides** — special files swap in pre-authored templates (landmark, island, arena, etc.).
  - Templates are `BeadCell[]` patterns relative to `(gridX, gridY)`.

#### Temperature & fused state (runtime, client-only)

Per-cell render state held entirely on the client:

- `temperature: number` (0..1) — mutable at runtime, mutated by the iron tool.
- `fused: boolean` — latched once `temperature` exceeds the fuse threshold. Enables same-color merging.

A runtime `Map<cellKey, { temperature, fused }>` keyed by absolute grid coordinate holds this state. Server-returned data is pure (positional + color); the iron tool mutates the map without rebuilding `BeadNode`s. All beads spawn cold (`temperature = 0`, `fused = false`).

#### Labels as bead sprites

File and folder labels are sprites of `BeadCell[]` generated from a pixel-font lookup:

- Bitmap pixel font (3×5 default per glyph) maps each character to a grid pattern.
- Filled pixels → dark beads (`PerlerColor.Black`) at those grid offsets; empty pixels → no extra bead (white-bead fill shows through).
- Label cells are packed alongside the file sprite by `sprite-pack.ts`. Default placement: a label slot directly below each file sprite, centered, truncated to fit the slot width.
- Folder label = a small bead-tag in a corner of the board.

#### White-bead background fill

Each folder's pegboard is **fully populated**: the sprite-pack stage emits `BeadCell` instances for every grid intersection. File and label cells override the default; every other cell defaults to `PerlerColor.White`.

### 4. Backend pipeline

- `metadata.ts` — adapts to the new fields; computes `importance` per file as before; no `brightness` (dropped); no `initialTemperature` (dropped — user-only iron).
- `sprite-pack.ts` (NEW) — for each folder: build child sprites (default = disk sized by importance, role overrides for landmarks), build label sprites, lay them out on a grid bottom-up, fill remaining cells with white beads. Outputs a complete `BeadCell[]` per file plus the folder's `gridCols × gridRows`.
- `world-layout.ts` (NEW; replaces `layout.ts`) — places folder boards in the world (still squarified-treemap-like, but driven by each folder's required pixel size = grid × pin spacing rather than a free importance number).
- `routes/browse.ts` (NEW) — `GET /api/browse?path=...` returns directory entries (subdirs only) for the folder-picker UI; `GET /api/browse-home` returns the server's home directory for default starting point.

### 5. Frontend rendering & UX

#### Bead rendering — temperature-driven (batched)

Replaces `bead-node.ts` rounded rects.

- Per-cell shape interpolated by **temperature**:
  - `t ≈ 0` (cold): thick ring (annulus). Inner radius ≈ 0.45 × outer.
  - `t ≈ 1` (fully fused): filled cell — outer radius ≈ 0.55–0.6 × pin spacing so neighbors overlap; inner hole closed.
  - Intermediate: smoothly tween outer outward and inner toward 0.
- **Same-color neighbor merging** activates between cells where both have `fused: true`. Implementation: fused cells render with outer radius > pin spacing × 0.5, so adjacent same-color cells visually overlap into a merged blob — no explicit polygon-union pass needed.
- Stacked layers (`layer > 0`) render with z-offset and shadow for voxel depth.
- **Performance.** With white-bead fill a region can have 10k+ cells. Per-cell `PIXI.Graphics` won't survive. Use one `PIXI.Graphics` (or `PIXI.Mesh`) per region, redrawn when any cell's temperature/fused state changes within it. The iron tool tracks dirty regions per frame.

#### Region (board) rendering

Replaces `folder-region.ts`.

- A faint wood/plastic frame around the region perimeter.
- Pin grid drawn beneath the bead layer; pins show only inside unfused ring centers.
- Folder name as a paper bead-tag clipped to a corner.

#### Iron / steam tool

A user-facing brush tool — selectable in the controls bar.

- **Selection.** Click "Iron" in the controls bar; cursor becomes an iron-shaped icon while the canvas is the cursor target.
- **Application.** Press-and-hold (or click-drag) over the canvas. While held, beads inside the brush radius gain temperature each tick (start: +0.04/frame ≈ ~0.4s to fuse). Brush radius is adjustable via a slider.
- **Render feedback.** Beads under the brush visibly swell as their temperature rises; a subtle warm glow follows the brush; faint steam particles rise. Once a bead crosses threshold, `fused: true` latches and same-color merging activates.
- **Persistence.** Both `temperature` and `fused` persist after the iron lifts (mirrors the craft). A "Reset board" sidebar action re-cools and un-fuses everything.
- **Quick toggles.** Sidebar buttons for "All cold" (rings everywhere) and "All fused" (full pixel-art view, useful for screenshots).

#### Folder picker

Replaces the typed-path-only input.

- Path input gains a **"Browse..."** button.
- Click → modal opens at the server's home directory (fetched on mount).
- Modal shows: current path at top, "↑ Up" button, list of clickable subdirectories. Two actions: **Cancel** / **Select this folder**.
- Server endpoints: `GET /api/browse?path=...` and `GET /api/browse-home`.

### 6. Architecture & distribution

_(no entries yet)_

### 7. Intelligence layer

_(no entries yet)_

---

## Open questions & tensions

*Only unresolved ones; resolved decisions live in Synthesis.*

### Importance → disk radius curve

Pick a curve. Working assumption: **`sqrt`** (gentle scaling, doubling importance ≈ 1.4× radius). Tune visually once the renderer is up.

### Voxel stacks for landmarks (deferred to v2 within v1?)

User chose "full overhaul" but stacks need real authoring (which beads on which layer). v1 fallback: landmark files (README etc.) get a larger flat disk in a distinct color. v2 authors layered sprites. Decide once flat-disk landmarks render — if they read as monumental enough, defer stacks.

### Role-specific sprite templates (which to author for v1)

Minimum useful set: `README*` → larger disk in `PerlerColor.Gold`; `Dockerfile` → square island in `PerlerColor.Blue`; everything else → default disk. More templates land later.

### Visual tuning constants

Defer until renderer renders; tune by feel.

- Pin spacing in world pixels (start: 14)
- Ring outer radius / pin spacing (≈ 0.4 cold)
- Ring inner radius / outer (≈ 0.45 cold — controls thickness)
- Fused cell radius / pin spacing (≈ 0.55 — neighbors overlap)
- Pin-dot diameter / pin spacing (≈ 0.1)
- Iron heat rate, fuse threshold (≈ 0.7), brush radius range
- Pixel font dimensions (3×5)

---

## Impact map

| Thread | Touches | Scope |
| ------ | ------- | ----- |
| Shared types & perler palette | `packages/shared/src/types.ts` (BeadCell, refactor BeadNode, PerlerColor enum), `packages/shared/src/language-colors.ts` (rewrite for perler), new `packages/shared/src/pixel-font.ts` | **Foundational.** Net-add the enum, palette, and font; refactor BeadNode for sprite-on-grid. |
| Server pipeline rewrite | `packages/server/src/scanner/metadata.ts` (drop brightness/initialTemp), new `packages/server/src/graph/sprite-pack.ts` (sprites + labels + white fill), replace `packages/server/src/graph/layout.ts` with `world-layout.ts` (bottom-up), `packages/server/src/graph/builder.ts`, `packages/server/src/routes/workspace.ts` | **Large.** Replaces the layout stage; adds sprite/label/white-fill packing; folder size is now derived from grid needs. |
| Frontend bead rendering (batched, temperature-driven) | `packages/client/src/renderer/bead-node.ts` (rewrite as region-batched bead-cell renderer with ring↔filled interpolation, same-color merging via overlapping circles, voxel z-offset), `packages/client/src/renderer/folder-region.ts` (board frame + pin grid + label tag), `packages/client/src/renderer/app.ts` (new data model wiring + runtime cell-state map + ticker) | **Substantial renderer rewrite.** Move to one Graphics/Mesh per region, redraw on dirty. |
| Iron / steam tool | new `packages/client/src/tools/iron-tool.ts`, hooks into `app.ts` (cursor, brush state, ticker heat application), `packages/client/src/ui/controls.ts` (Iron button + brush slider), `packages/client/src/ui/sidebar.ts` ("Reset board" / "All cold" / "All fused" toggles) | **Medium-large.** New tool subsystem; UI wiring; runtime cell-state mutation. |
| Folder picker | new `packages/server/src/routes/browse.ts` (`/api/browse`, `/api/browse-home`), `packages/server/src/index.ts` (mount), `packages/client/src/ui/folder-picker.ts` (modal) + CSS, `packages/client/src/main.ts` (wire) | **Medium.** Two endpoints + a modal navigator. Doesn't depend on the bead overhaul. |
| Sidebar legend for perler palette | `packages/client/src/ui/sidebar.ts` | **Small.** Replace language→hex legend with language→perler swatches and color names. |
