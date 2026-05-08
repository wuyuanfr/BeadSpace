# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BeadSpace renders a local workspace as **real perler-bead pixel art**: every file is a disk sprite of named perler-color rings on a pin grid; every folder is a nested pegboard. An interactive iron tool lets the user heat individual beads — temperature drives swelling (ring ⇌ filled), and adjacent same-color cells merge above a fuse threshold. The product/UX intent lives in `UI_design.md`; the evolution of design decisions (and what's deliberately deferred) lives in `DESIGN.md`. `MVP Implementation Plan.md` describes the earlier treemap-based MVP and is **superseded** — the current code is bottom-up grid-packed sprites, not a treemap.

## Commands

npm workspaces monorepo: `@beadspace/shared`, `@beadspace/server`, `@beadspace/client`.

- `npm run dev` — server (`tsx watch`) + client (`vite`) concurrently.
- `npm run build` — shared → server → client (order matters).
- `npm run dev -w packages/server` — server only (port **3002**).
- `npm run dev -w packages/client` — client only (port **3003**, proxies `/api` → `localhost:3002`).

No test runner, linter, or formatter is configured. Don't invent npm scripts that don't exist.

## Architecture

### Data flow (single scan)

```
file-tree.ts (walk fs) ─┐
                        ├─→ metadata.ts → builder.ts → sprite-pack.ts → JSON
git-analyzer.ts (git log)┘
```

Triggered by `GET /api/workspace?path=...` in `routes/workspace.ts`. The route also synthesizes a root folder node (id `""`) so the workspace itself becomes a pegboard containing all top-level entries.

A separate folder-picker subsystem lives at `routes/browse.ts` (`GET /api/browse-home`, `GET /api/browse`).

### `BeadNode` is a discriminated union

`packages/shared/src/types.ts` defines:

- `BeadCell { dx, dy, color: PerlerColor, layer? }` — one bead at a grid offset.
- `FileBeadNode { type: "file", gridX, gridY, sprite, labelSprite, spriteWidth, spriteHeight, ... }` — a file's disk + bead-rendered label, positioned in absolute grid coordinates.
- `FolderBeadNode { type: "folder", children, gridX, gridY, gridCols, gridRows, labelSprite, ... }` — a pegboard, sized bottom-up.
- `BeadNode = FileBeadNode | FolderBeadNode`. Always narrow by `type` before accessing file- or folder-specific fields.

`WorkspaceGraph` carries `pinSpacing` (world pixels per grid cell, currently 14). Server emits grid units; the client multiplies by `pinSpacing`.

### sprite-pack is the heart of layout

`packages/server/src/graph/sprite-pack.ts` does three things in two passes:

1. **Bottom-up grid sizing.** Recurse into each folder; first pack any subfolders so they have known `gridCols × gridRows`, then build sprites for child files (default = disk with radius `sqrt(importance)`-scaled; role overrides for `README*` → gold disk, Dockerfile family → navy square). Build a label sprite for each file from `pixel-font.ts`. Pack all children (files + subfolders) onto a row-wrap grid sorted by area descending. The folder's `gridCols/gridRows` is the resulting extent plus padding plus a top strip for its own bead label.
2. **Top-down world coords.** Walk from root, assigning absolute `gridX/gridY` to every node based on parent position + child's relative slot.

Children's relative positions are stashed in a `Map<id, {relX, relY}>` scoped to each `packAllFolders` call (intentionally not module-level state).

### Iron tool & runtime state

`packages/client/src/renderer/cell-state.ts` holds a `Map<"x,y", { temperature, fused }>`. The iron tool (`packages/client/src/tools/iron-tool.ts`) writes to it; regions read from it. **Server-returned data is pure** — colors and grid positions only — and the per-cell live state lives entirely on the client. There is no "auto iron pass" on scan; beads spawn cold and the user is the only thing that heats them.

When iron is active, viewport pan is disabled (`setViewportPanEnabled(false)`); the iron tool intercepts left-click + drag.

### Region rendering

Each folder owns one `Region` (`packages/client/src/renderer/region.ts`) with three `PIXI.Graphics` layers — a board surface, a static pin-dot grid (drawn once), and a `beadGraphic` redrawn on dirty. The bead pass groups cells by color for batched fills; a separate pass draws cream-colored "inner punches" that create the ring shape when cells are cold. Same-color merging when fused is implicit: fused outer radius (~0.52 × pinSpacing) is slightly more than half a pin, so adjacent fused same-color cells naturally overlap into one blob.

`buildRegionCells` (also in `region.ts`) computes the cells a region owns: its folder label, child files' sprite + label cells, and white-bead fill for every other grid intersection in the folder's rect — minus child folders' bounding rects (which the children draw themselves).

### Importance, palette, and color

- **Importance** = `0.4 × normalizedSize + 0.6 × normalizedCommitCount` for files; folders sum children's importance (in `builder.ts`). It drives the disk radius via `sqrt` scaling. No `brightness` field exists anymore.
- **Palette** is `PerlerColor` (~46 named colors with hex + display name) in `packages/shared/src/perler-palette.ts`. Language → color is hand-curated in `language-colors.ts`. Don't introduce arbitrary hex on the canvas — everything visible should come from the palette.
- **Coordinates are grid units** in the data model. Renderer scales by `pinSpacing`. There are no world-pixel coords on `BeadNode`.

### Filesystem walk constraints

`file-tree.ts` enforces `MAX_DEPTH = 8` and `MAX_NODES = 5000`, hard-skips a fixed set of directories (`node_modules`, `.git`, `dist`, ...) plus dotfiles except `.gitignore`, and honors `.gitignore` patterns via the `ignore` package. If a user's repo is missing files, this is usually why.

### Client UI is HTML, canvas is PixiJS

Tooltip, sidebar, detail card, controls, folder picker — all plain DOM in `index.html` + CSS. PixiJS draws only the bead canvas. The split is deliberate; don't migrate UI chrome into PixiJS.

## Conventions

- **ESM with `.js` import suffix** on local imports (e.g. `import { ... } from "./foo.js"`) even though sources are `.ts`. This is required by the `moduleResolution: "bundler"` + ESM setup.
- **Shared package consumed as source.** `@beadspace/shared` exports `./src/index.ts` directly; server (`tsx`) and client (Vite) read the `.ts` directly. The `tsc` build for shared exists for completeness but isn't needed for `dev`.
- **Strict TypeScript everywhere.** Discriminated-union narrowing is the norm for `BeadNode`.
- **Windows paths.** Repo lives on Windows. Git output and `fs` calls normalize to forward slashes before comparison; preserve that.
- **Root id is the empty string.** The synthetic workspace root has `id: ""`. Several places key off this — be careful with falsy checks; prefer `!== undefined` over `if (id)`.

## Visual design constraints

`UI_design.md` is prescriptive. Background is cream (`#F4ECC8` for boards, `#F9F8F4` for the page); accents are pastel; everything visible on the canvas is a perler-color bead. The board background, pin grid, frame, and folder labels are part of every region. **Do not** introduce dark/cyberpunk/terminal aesthetics. The medium is *pixel/voxel art with the ring-on-pin as the base unit* — uniform bead size, named colors, ring↔filled transition driven by user temperature.
