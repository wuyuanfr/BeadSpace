### Overall Architecture

The application follows a **client-server monorepo** structure:

* **Backend (Node.js/Express)** : Scans the filesystem, reads git history, builds the graph data model, and serves it via a REST API.
* **Frontend (Vite + TypeScript + PixiJS)** : Fetches the graph data and renders the bead/pixel art map with interactivity.

The backend and frontend communicate via a simple JSON REST API. For the MVP, the user points the backend at a local directory path, and the frontend renders the result.

```
C:\Users\18270\workspace\Games\BeadSpace\
├── package.json                  # Root workspace config (npm workspaces)
├── tsconfig.base.json            # Shared TS config
├── packages/
│   ├── shared/                   # Shared types and constants
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts          # Core data model interfaces
│   │       └── language-colors.ts # Language -> color mapping
│   ├── server/                   # Backend workspace scanner
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts          # Express server entry
│   │       ├── scanner/
│   │       │   ├── file-tree.ts  # Recursive directory walker
│   │       │   ├── git-analyzer.ts # Git log parsing
│   │       │   └── metadata.ts   # Language detection, size stats
│   │       ├── graph/
│   │       │   ├── builder.ts    # Converts scan results -> graph
│   │       │   └── layout.ts     # Assigns x,y positions (treemap)
│   │       └── routes/
│   │           └── workspace.ts  # GET /api/workspace?path=...
│   └── client/                   # Frontend PixiJS renderer
│       ├── package.json
│       ├── tsconfig.json
│       ├── index.html
│       ├── vite.config.ts
│       └── src/
│           ├── main.ts           # App entry, fetch data, init PixiJS
│           ├── renderer/
│           │   ├── app.ts        # PixiJS Application setup
│           │   ├── bead-node.ts  # Individual file bead sprite
│           │   ├── folder-region.ts # Folder background region
│           │   └── tooltip.ts    # Hover/click info panel
│           ├── camera/
│           │   └── viewport.ts   # Pan, zoom, drag controls
│           └── ui/
│               ├── sidebar.ts    # File details panel
│               └── controls.ts   # Path input, refresh button
```

---

### Phase 1: Project Scaffolding and Shared Types

 **Goal** : Set up the monorepo, tooling, and define the core data model.

#### 1a. Root workspace setup

`package.json` at root uses npm workspaces pointing to `packages/*`. Scripts for `dev` (runs server + client concurrently), `build`, and `lint`.

Dependencies at root: `typescript`, `concurrently`, `eslint`.

#### 1b. Shared data model (`packages/shared/src/types.ts`)

This is the heart of the system. The graph data model:

```
// A single node in the workspace graph
interface BeadNode {
  id: string;              // Unique path-based ID: "src/utils/helpers.ts"
  name: string;            // "helpers.ts"
  path: string;            // Full relative path from workspace root
  type: "file" | "folder";
  
  // File-specific metadata
  language?: string;       // "typescript", "python", etc.
  extension?: string;      // ".ts", ".py"
  sizeBytes?: number;      // Raw file size
  lineCount?: number;      // Lines of code
  
  // Git metadata
  gitCommitCount?: number; // Total commits touching this file
  gitLastModified?: string;// ISO date of last commit
  gitAuthors?: string[];   // Unique contributors
  gitRecentActivity?: number; // Commits in last 30 days (drives brightness)
  
  // Graph relationships
  parentId?: string;       // Parent folder ID (null for root)
  children?: string[];     // Child IDs (for folders)
  depth: number;           // Nesting depth from root
  
  // Layout (computed by server)
  x: number;               // Pixel x position
  y: number;               // Pixel y position
  width: number;           // Bead width in pixels
  height: number;          // Bead height in pixels
  
  // Visual properties (computed by server)
  color: string;           // Hex color based on language
  brightness: number;      // 0.0-1.0 based on git activity
  importance: number;      // 0.0-1.0 composite score (size + activity)
}

// The complete workspace graph sent to the frontend
interface WorkspaceGraph {
  rootPath: string;
  rootName: string;
  nodes: BeadNode[];
  metadata: {
    totalFiles: number;
    totalFolders: number;
    languages: Record<string, number>; // language -> file count
    scanTimestamp: string;
  };
}
```

#### 1c. Language color map (`packages/shared/src/language-colors.ts`)

A hardcoded map derived from GitHub Linguist colors. This avoids an external dependency for the MVP:

```
const LANGUAGE_COLORS: Record<string, string> = {
  typescript:  "#3178C6",
  javascript:  "#F7DF1E",
  python:      "#3572A5",
  rust:        "#DEA584",
  go:          "#00ADD8",
  java:        "#B07219",
  csharp:      "#178600",
  cpp:         "#F34B7D",
  c:           "#555555",
  ruby:        "#701516",
  php:         "#4F5D95",
  swift:       "#F05138",
  kotlin:      "#A97BFF",
  html:        "#E34C26",
  css:         "#563D7C",
  scss:        "#C6538C",
  json:        "#A4A4A4",
  yaml:        "#CB171E",
  markdown:    "#083FA1",
  dockerfile:  "#384D54",
  shell:       "#89E051",
  sql:         "#E38C00",
  // Default for unknown
  unknown:     "#888888",
};
```

Extension-to-language mapping as a companion lookup:

```
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "typescript", ".tsx": "typescript",
  ".js": "javascript", ".jsx": "javascript",
  ".py": "python",
  ".rs": "rust",
  ".go": "go",
  // ... etc
};
```

---

### Phase 2: Backend -- Workspace Scanner

 **Goal** : Read a directory tree, gather git metadata, build the graph with layout positions.

#### 2a. File tree scanner (`packages/server/src/scanner/file-tree.ts`)

Recursive directory walker using `fs.readdir` with `withFileTypes: true`. Key behaviors:

* Respects `.gitignore` patterns (use the `ignore` npm package to parse `.gitignore`).
* Skips `node_modules`, `.git`, `dist`, `build`, `__pycache__`, `.venv` by default.
* Returns a flat array of `RawFileEntry` objects:

```
interface RawFileEntry {
  path: string;        // Relative to workspace root
  name: string;
  type: "file" | "folder";
  extension?: string;
  sizeBytes?: number;
  depth: number;
  parentPath?: string;
}
```

Implementation approach: Use `fs.promises.readdir` recursively. Limit depth to 8 levels for performance. Cap total nodes at 5000 for the MVP to keep rendering manageable.

#### 2b. Git analyzer (`packages/server/src/scanner/git-analyzer.ts`)

Reads git history using child_process to run git commands. Two key queries:

**Query 1 -- Per-file commit counts** (the single most important git data):

```
git log --format=format: --name-only | sort | uniq -c | sort -rn
```

This returns every file path with its total commit count. Parse the output into a `Map<string, number>`.

**Query 2 -- Recent activity** (last 30 days):

```
git log --since="30 days ago" --format=format: --name-only | sort | uniq -c | sort -rn
```

 **Query 3 -- Last modified date per file** :

```
git log --format="%H %aI" --name-only
```

Parse to extract per-file last-modified ISO date.

All three git queries run via `child_process.execSync` or `execFile` with `cwd` set to the workspace path. If the directory is not a git repo, gracefully return empty maps (git metadata is optional).

#### 2c. Metadata enrichment (`packages/server/src/scanner/metadata.ts`)

Combines the file tree entries with git data. Computes:

* `language` from extension lookup
* `color` from language color map
* `brightness` from git recent activity, normalized: `Math.min(1, recentCommits / maxRecentCommits)`
* `importance` score: a weighted composite `0.4 * normalizedSize + 0.6 * normalizedCommitCount` -- this drives the visual size of the bead

#### 2d. Graph builder (`packages/server/src/graph/builder.ts`)

Converts the enriched entries into the `BeadNode[]` array with parent-child relationships. Sets `children` arrays on folder nodes. Computes the `importance` score which the layout algorithm needs.

#### 2e. Treemap layout (`packages/server/src/graph/layout.ts`)

This is the key algorithm. Uses a **squarified treemap** approach to assign x, y, width, height to every node:

* The root folder gets the full canvas rectangle (e.g., 2000x2000 pixels).
* Each folder subdivides its rectangle among its children proportionally to their `importance` (for files) or total subtree importance (for folders).
* Files get their final rectangle. Minimum bead size: 12x12 pixels. Maximum: 120x120.
* Folders keep a small padding/margin (4px) to create visible borders between regions.

Algorithm: Implement a basic squarified treemap. The key function:

```
function layoutTreemap(
  nodes: BeadNode[],         // all nodes
  parentId: string | null,   // current folder
  rect: { x: number, y: number, w: number, h: number }
): void
```

This recursively divides rectangles. For the MVP, a simple slice-and-dice (alternating horizontal/vertical splits by depth level) is sufficient and much simpler than full squarified treemap. Each level alternates split direction:

* Even depth: split horizontally (children stack left to right)
* Odd depth: split vertically (children stack top to bottom)

#### 2f. Express API (`packages/server/src/routes/workspace.ts`)

Single endpoint:

```
GET /api/workspace?path=/path/to/workspace
```

Response: `WorkspaceGraph` JSON.

CORS enabled for localhost dev. The server runs on port 3001.

Server dependencies: `express`, `cors`, `ignore` (for gitignore parsing).

---

### Phase 3: Frontend -- PixiJS Rendering

 **Goal** : Fetch the graph and render it as an interactive pixel art map.

#### 3a. Vite + PixiJS setup (`packages/client/`)

Dependencies: `pixi.js` (v8), `@pixi/ui` (optional).

`vite.config.ts`: Dev server on port 3000, proxy `/api` to `localhost:3001`.

#### 3b. Application bootstrap (`packages/client/src/main.ts`)

1. Show a simple HTML input for the workspace path (or use a default).
2. Fetch `GET /api/workspace?path=...`.
3. Initialize the PixiJS application with the full browser viewport.
4. Pass the `WorkspaceGraph` to the renderer.

#### 3c. PixiJS application (`packages/client/src/renderer/app.ts`)

```
class BeadSpaceApp {
  private app: PIXI.Application;
  private viewport: Viewport; // pan/zoom container
  
  async init(container: HTMLElement): Promise<void> {
    this.app = new PIXI.Application();
    await this.app.init({
      resizeTo: container,
      backgroundColor: 0x1a1a2e,  // Dark background
      antialias: false,            // Pixel art look -- keep crisp
    });
    container.appendChild(this.app.canvas);
  }
  
  renderGraph(graph: WorkspaceGraph): void {
    // 1. Render folder regions (backgrounds) first
    // 2. Render file beads on top
    // 3. Set up interactivity
  }
}
```

#### 3d. Folder regions (`packages/client/src/renderer/folder-region.ts`)

Each folder node renders as a semi-transparent colored rectangle:

```
function createFolderRegion(node: BeadNode): PIXI.Graphics {
  const g = new PIXI.Graphics();
  // Subtle background with folder-depth-based color
  const alpha = 0.15 + (node.depth * 0.05);
  const hue = (node.depth * 60) % 360;  // Rotate hue by depth
  g.rect(node.x, node.y, node.width, node.height);
  g.fill({ color: hslToHex(hue, 30, 20), alpha });
  g.stroke({ color: hslToHex(hue, 40, 40), width: 1, alpha: 0.5 });
  
  // Folder name label at top-left
  const label = new PIXI.Text({
    text: node.name,
    style: { fontSize: 10, fill: 0xaaaaaa, fontFamily: "monospace" }
  });
  label.position.set(node.x + 4, node.y + 2);
  
  const container = new PIXI.Container();
  container.addChild(g, label);
  return container;
}
```

#### 3e. File beads (`packages/client/src/renderer/bead-node.ts`)

Each file renders as a colored rounded rectangle (the "bead"):

```
function createBeadNode(node: BeadNode): PIXI.Container {
  const container = new PIXI.Container();
  container.eventMode = "static";
  container.cursor = "pointer";
  
  // Main bead shape
  const bead = new PIXI.Graphics();
  const color = parseInt(node.color.replace("#", ""), 16);
  
  // Inner bead with rounded corners (pixel art jigsaw feel)
  const padding = 1; // Gap between beads
  bead.roundRect(
    node.x + padding, node.y + padding,
    node.width - padding * 2, node.height - padding * 2,
    3 // Corner radius -- small for pixel feel
  );
  bead.fill(color);
  
  // Apply brightness as alpha overlay
  // High git activity = full brightness; low = dimmer
  const brightnessOverlay = new PIXI.Graphics();
  brightnessOverlay.rect(node.x, node.y, node.width, node.height);
  brightnessOverlay.fill({ color: 0x000000, alpha: 1 - node.brightness });
  
  // File name label (only if bead is large enough)
  if (node.width > 30 && node.height > 16) {
    const label = new PIXI.Text({
      text: node.name.length > 12 ? node.name.slice(0, 10) + ".." : node.name,
      style: { fontSize: 8, fill: 0xFFFFFF, fontFamily: "monospace" }
    });
    label.position.set(node.x + 3, node.y + 3);
    container.addChild(label);
  }
  
  container.addChild(bead, brightnessOverlay);
  return container;
}
```

#### 3f. Viewport / camera (`packages/client/src/camera/viewport.ts`)

Implement pan and zoom on the main container holding all the bead graphics:

* **Zoom** : Listen to `wheel` events on the canvas. Scale the root container. Clamp between 0.1x and 5x.
* **Pan** : On `pointerdown` start tracking, on `pointermove` translate the container, on `pointerup` stop.
* Wrap all rendered content in a single `PIXI.Container` that gets transformed.

This is simpler than using a library like `pixi-viewport` for the MVP. Roughly 60 lines of code.

#### 3g. Tooltip and info panel (`packages/client/src/renderer/tooltip.ts` and `packages/client/src/ui/sidebar.ts`)

 **Tooltip (hover)** : An HTML `div` positioned absolutely over the canvas. On `pointerover` of a bead, show:

```
helpers.tsTypeScript | 245 lines | 32 commits
```

Using HTML overlay is simpler and looks better than PixiJS text for tooltips.

 **Sidebar (click)** : On click, populate an HTML sidebar panel with full details:

* File path
* Language
* Size
* Git commit count
* Last modified
* Top contributors
* Recent activity sparkline (stretch goal)

#### 3h. Controls UI (`packages/client/src/ui/controls.ts`)

Simple HTML bar at the top:

* Text input for workspace path
* "Scan" button to trigger fetch
* Language legend (colored squares with language names)

---

### Phase 4: Polish and Visual Identity

 **Goal** : Make it feel like a living bead puzzle world, not just a treemap.

#### 4a. Bead texture

Instead of plain rounded rectangles, create a tiny bead/puzzle piece texture (16x16 pixel art PNG, or generated procedurally with PixiJS Graphics). Apply as a tiling sprite or texture on each bead. This gives the "jigsaw puzzle" aesthetic. The texture should have:

* A subtle inner highlight (top-left lighter)
* A slight shadow (bottom-right darker)
* Small interlocking tabs on edges (drawn in the Graphics calls)

#### 4b. Ambient animation

* Beads with high `gitRecentActivity` gently pulse (subtle alpha oscillation via a PixiJS ticker).
* Folder regions have a very slow color-shift animation.
* On initial load, beads "fall into place" with a staggered entrance animation (each bead starts at y - 20 with alpha 0, and tweens into position).

#### 4c. Special file handling

Per the initial.md vision:

* `README.md` gets a distinct "monument" appearance: larger, golden color (#FFD700), with a small star/crown icon.
* `Dockerfile` gets a distinct water/island blue border.
* Files with "test" in the path get a slightly different shade (lighter version of their language color).

---

### Phase 5: Integration and Delivery

#### 5a. Concurrently dev script

Root `package.json` script:

```
{
  "scripts": {
    "dev": "concurrently \"npm run dev -w packages/server\" \"npm run dev -w packages/client\"",
    "build": "npm run build -w packages/shared && npm run build -w packages/server && npm run build -w packages/client"
  }
}
```

Server uses `tsx watch` for development. Client uses Vite dev server.

#### 5b. Production build

Server compiles to JS, client builds with Vite. A single `npm start` runs the Express server which also serves the built client static files from `packages/client/dist/`.

---

### Dependency Summary

 **Root** : `typescript`, `concurrently`

 **packages/shared** : no runtime deps (pure types + constants)

 **packages/server** : `express`, `cors`, `ignore` (gitignore parsing), `tsx` (dev)

 **packages/client** : `pixi.js` (v8), `vite` (dev)

No other frameworks. Intentionally minimal.

---

### Implementation Sequence (Recommended Order)

| Step            | What                                                      | Est. Effort        | Output                |
| --------------- | --------------------------------------------------------- | ------------------ | --------------------- |
| 1               | Scaffold monorepo, install deps, configure TS             | 30 min             | Project boots         |
| 2               | `packages/shared/src/types.ts` + `language-colors.ts` | 20 min             | Core types            |
| 3               | `file-tree.ts` scanner                                  | 45 min             | Flat file list        |
| 4               | `git-analyzer.ts`                                       | 45 min             | Git metadata maps     |
| 5               | `metadata.ts` + `builder.ts`                          | 30 min             | Full `BeadNode[]`   |
| 6               | `layout.ts` treemap                                     | 60 min             | Positioned nodes      |
| 7               | Express route serving JSON                                | 20 min             | API works             |
| 8               | Vite client + PixiJS app shell                            | 30 min             | Empty canvas          |
| 9               | Folder regions rendering                                  | 30 min             | Colored regions       |
| 10              | File bead rendering                                       | 45 min             | Beads on screen       |
| 11              | Viewport pan/zoom                                         | 30 min             | Navigable map         |
| 12              | Tooltip + sidebar                                         | 30 min             | Interactive           |
| 13              | Visual polish (textures, animations)                      | 60 min             | Looks good            |
| **Total** |                                                           | **~8 hours** | **Working MVP** |

---

### Key Design Decisions and Rationale

1. **Treemap layout over force-directed graph** : A treemap preserves the folder hierarchy visually (folders are literally rectangular regions containing their children). A force-directed graph would lose the spatial containment relationship. Treemaps also fill the screen efficiently with no wasted space.
2. **Server-side layout computation** : The layout algorithm runs on the server so the client receives pre-positioned nodes. This keeps the client simple (just render) and allows the server to cache results.
3. **HTML overlays for UI, PixiJS for the map** : Tooltips, sidebars, and controls are regular HTML/CSS -- much easier to style and more accessible. Only the bead map itself uses PixiJS.
4. **Brightness via dark overlay rather than color manipulation** : Multiplying a dark semi-transparent rectangle over each bead is simpler than computing HSL brightness variants of arbitrary colors, and gives a consistent "dim vs bright" look across all language colors.
5. **Git data is optional** : If the workspace is not a git repo, everything still works -- beads just all have equal brightness. This avoids a hard dependency on git.
6. **No WebSocket for MVP** : The scan is triggered by a button click and returns a full snapshot. Live file-watching and incremental updates are post-MVP.

---

### Critical Files for Implementation

* `C:\Users\18270\workspace\Games\BeadSpace\packages\shared\src\types.ts` -- Core data model interfaces (BeadNode, WorkspaceGraph) that both server and client depend on. Must be defined first.
* `C:\Users\18270\workspace\Games\BeadSpace\packages\server\src\graph\layout.ts` -- Treemap layout algorithm that converts hierarchical file data into positioned rectangles. The most algorithmically complex piece.
* `C:\Users\18270\workspace\Games\BeadSpace\packages\client\src\renderer\bead-node.ts` -- PixiJS rendering of individual file beads with color, brightness, labels, and interactivity. The core visual element.
* `C:\Users\18270\workspace\Games\BeadSpace\packages\server\src\scanner\git-analyzer.ts` -- Git history parsing that drives the "living" aspect (brightness, importance). Critical for the visualization to feel dynamic.
* `C:\Users\18270\workspace\Games\BeadSpace\packages\client\src\renderer\app.ts` -- Main PixiJS application orchestrator that ties folder regions, beads, viewport, and interactivity together.
