# BeadSpace

> Visualize a local workspace as **perler-bead pixel art** — interact with it through a virtual iron.

Every file is rendered as a small disk of plastic-bead rings on a pegboard. Folders become nested boards, languages map to a fixed perler color palette, empty space is filled with white beads. Pick up the iron tool to heat individual beads — they swell, fuse, and merge with same-color neighbors into solid pixel art. Cool ⇌ fused, ring ⇌ filled, work-in-progress ⇌ finished.

## Architecture

Client–server monorepo (npm workspaces):

```
packages/
├── shared/   # Perler palette, sprite types, language→color map, 3×5 pixel font
├── server/   # Express API: scans fs, reads git, packs sprites onto pegboards
└── client/   # Vite + PixiJS renderer + iron tool + folder picker
```

The server does all layout: each folder becomes a pegboard whose dimensions are derived bottom-up from its contents. Each file gets a disk sprite (radius scaled by importance), a label sprite generated from a 3×5 pixel font, and the remaining cells are filled with white beads. Per-cell temperature/fusion state lives only on the client and is mutated by the iron tool.

```
file-tree.ts (walk fs)  ─┐
                         ├─→ metadata.ts → builder.ts → sprite-pack.ts → JSON
git-analyzer.ts (git log)┘
```

## Getting started

Prerequisites: Node.js 20+, npm. Git is optional (used for commit-count → importance).

```bash
npm install
npm run dev
```

- **Server** on `http://localhost:3002`
- **Client** on `http://localhost:3003` — open in a browser

In the client: click **Browse...** to pick a folder (or paste a path), hit **Scan**. The world appears as cold rings on pegboards. Toggle the **♨ Iron** button to enter iron mode and drag across the canvas to heat beads — they swell and fuse over the threshold. Brush radius is adjustable in the top bar; sidebar has bulk **Reset / All Cold / All Fused** actions.

### Other commands

```bash
npm run build                       # build all three packages
npm run dev -w packages/server      # backend only
npm run dev -w packages/client      # frontend only
```

## How it works

### Perler bead medium

Every visible thing on the canvas is a bead from a fixed palette (~46 named perler colors, hand-mapped from languages — TypeScript → blue, Python → sky blue, Rust → tan, etc., see `packages/shared/src/language-colors.ts`). Beads sit on a pin grid at uniform size. There is no font on the canvas — file and folder labels are bead patterns generated from a 3×5 pixel font in `packages/shared/src/pixel-font.ts`.

### Two states: ring ↔ filled

Each bead has a runtime `temperature` (0..1) and a latched `fused` flag. Rendering interpolates a thick ring (cold) into a filled cell (fused) by temperature. Above a fuse threshold, adjacent same-color cells share a slightly enlarged outer radius so they overlap into a continuous merged blob — this gives the pixel-art look of fused perler art.

### Bottom-up pegboard sizing

The server's `sprite-pack.ts` recursively packs each folder:

1. Recurse into subfolders first (so they have known grid dimensions).
2. For each direct child file, build a sprite: default disk in language color (radius from importance), or a role override (`README*` → larger gold disk, `Dockerfile`/`docker-compose.*` → navy square island).
3. For each child file, build a label sprite from the pixel font, placed below the disk.
4. Pack all children (files + sub-folders) onto a grid using a row-wrap algorithm.
5. The folder's pegboard dimensions are derived from the resulting grid extent + padding + a top strip for the folder's own bead label.

Server emits absolute grid coordinates per node (`gridX`, `gridY`); the client multiplies by `pinSpacing` to get world pixels.

### Client rendering

Each folder is one `Region`: a board surface, a pin-dot grid, and one batched `PIXI.Graphics` for all the beads. Beads in the region are grouped by color for batched fills, with a second pass for the inner "punches" that create the ring shape when cold. Regions only redraw when their `dirty` flag is set — the iron tool flips the flag on regions overlapping the brush rect each frame.

### Iron tool

Toggle the iron in the top bar. While active:

- Viewport pan is disabled (the brush takes left-click); mouse wheel still zooms.
- A circular brush preview follows the cursor in world space.
- Click-drag heats every cell within the brush radius by `+0.04/frame`. Beads visibly swell as they heat.
- Once a cell crosses the fuse threshold (`0.7`), `fused` latches and same-color merging activates from that bead.
- `Reset Board` re-cools everything; `All Cold` / `All Fused` are bulk overrides.

Beads spawn cold (rings on pins). There is no automatic iron pass — the user is the one who irons.

### Folder picker

A modal navigator backed by two server endpoints (`GET /api/browse-home` and `GET /api/browse?path=...`). The server lists subdirectories on demand; the client renders a clickable list with up-button navigation. On Tauri/Electron later, this can be replaced with a native dialog.

## Project layout

```
packages/shared/src/
  types.ts              # BeadCell, BeadNode (file|folder discriminated union), WorkspaceGraph
  perler-palette.ts     # PerlerColor enum + hex/name maps
  language-colors.ts    # extension→language and language→PerlerColor
  pixel-font.ts         # 3×5 glyphs + renderLabel/measureLabel/truncateToWidth

packages/server/src/
  index.ts              # Express bootstrap (port 3002)
  routes/
    workspace.ts        # GET /api/workspace
    browse.ts           # GET /api/browse, /api/browse-home
  scanner/
    file-tree.ts        # recursive fs walk, gitignore-aware
    git-analyzer.ts     # git log → commit counts and dates
    metadata.ts         # raw entries → BeadNode drafts (importance, language)
  graph/
    builder.ts          # parent/child links, folder-importance rollup
    sprite-pack.ts      # disk+label sprites, bottom-up grid pack, white-bead fill

packages/client/src/
  main.ts               # bootstrap, scan flow, iron toggle, sidebar wiring
  renderer/
    app.ts              # PixiJS app, ticker, region orchestration
    region.ts           # Region renderer (board + pin grid + batched beads)
    cell-state.ts       # runtime temperature/fused per absolute grid cell
    tooltip.ts          # hover info overlay
  camera/
    viewport.ts         # pan/zoom (pan disabled when iron tool is active)
  tools/
    iron-tool.ts        # brush state, ticker heat application, dirty-region marking
  ui/
    sidebar.ts          # perler legend, iron bulk actions
    detail-card.ts      # click-to-open file details
    bottom-bar.ts       # ambient stats
    folder-picker.ts    # browse modal
  util/
    format.ts           # formatBytes
```

## Tech stack

- TypeScript (ESM, strict), npm workspaces
- Backend: Express, `ignore` (gitignore parser), `tsx` for dev
- Frontend: Vite 6, PixiJS 8

No tests, linter, or formatter configured.

## Reference docs

- `initial.md` — original product vision
- `MVP Implementation Plan.md` — earlier MVP design (treemap-based; superseded by the current pegboard model)
- `UI_design.md` — visual/UX direction (pastel handcrafted aesthetic)
- `DESIGN.md` — living design doc capturing the perler-medium evolution decisions
- `CLAUDE.md` — guidance for Claude Code in this repo
