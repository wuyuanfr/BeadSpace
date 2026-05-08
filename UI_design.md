# BeadSpace — UI/UX Design Document

### AI Workspace → Perler-Bead Pixel World

Version 1.0
Frontend Visual Design Specification

---

# 1. Product Vision

BeadSpace transforms a local development workspace into a living pastel-colored perler bead world.

Instead of showing files as folders and lists, the system visualizes a codebase as:

* bead landscapes
* pixel islands
* animated ecosystems
* soft handcrafted structures

The emotional goal is:

> “Your project feels alive.”

The experience should feel:

* calming
* playful
* artistic
* tactile
* slightly nostalgic
* creative rather than technical

Think:

* Studio Ghibli × IDE
* Notion calmness × pixel world
* Figma cleanliness × handcrafted beads

---

# 2. Core UX Flow

## Entry Flow

```txt
Launch App
    ↓
Select Local Workspace
    ↓
AI Scan Animation
    ↓
Bead World Generation
    ↓
Interactive Exploration
```

---

# 3. Overall Visual Direction

## Primary Style

### Theme

Soft pastel handcrafted pixel aesthetic.

The UI should NOT look:

* cyberpunk
* hacker-like
* dark terminal-heavy
* enterprise dashboard

Instead:

* warm
* toy-like
* paper-craft inspired
* cozy engineering

---

# 4. Color System

## Main Palette

### Background

| Name        | Color   |
| ----------- | ------- |
| Milk White  | #F9F8F4 |
| Soft Cream  | #F4F1EA |
| Cloud Beige | #ECE7DF |

---

### Accent Colors

| Purpose       | Color   |
| ------------- | ------- |
| Folder Forest | #A8D5BA |
| Model Lake    | #9BC7F7 |
| Dataset Sand  | #F3D19C |
| Docs Library  | #D7C3F1 |
| Git Activity  | #FFB7B2 |
| AI Generated  | #FFDCE5 |

---

### Interactive Highlights

| State            | Color   |
| ---------------- | ------- |
| Hover Glow       | #FFFFFF |
| Selected Glow    | #FFF1B8 |
| Active Animation | #B8F7D4 |

---

# 5. Application Layout

---

# Main Screen Layout

```txt
┌────────────────────────────────────────────┐
│ Top Navigation Bar                         │
├───────────────┬────────────────────────────┤
│ Left Sidebar  │                            │
│               │                            │
│ Workspace     │      Bead World Canvas     │
│ Layers        │                            │
│ AI Themes     │                            │
│ Filters       │                            │
│               │                            │
├───────────────┴────────────────────────────┤
│ Bottom Ambient Information Bar             │
└────────────────────────────────────────────┘
```

---

# 6. Top Navigation Bar

Height: 64px

Background:

* semi-transparent cream glassmorphism
* subtle blur
* floating appearance

## Left Section

### Logo

Small animated bead cluster.

Hover effect:

* beads softly jiggle

Text:

# BeadSpace

Font:

* rounded geometric sans-serif
* soft edges

Recommended:

* Inter Rounded
* Nunito
* SF Rounded

---

## Center Section

### Workspace Input Area

This is the hero interaction.

Component style:

```txt
┌────────────────────────────┐
│ 📁 Select Local Workspace  │
└────────────────────────────┘
```

Behavior:

* drag-and-drop supported
* click-to-browse
* animated dotted border
* bead particles appear on hover

After selection:

```txt
/home/project/llm-agent
```

with miniature folder bead icon.

---

## Right Section

### Action Buttons

| Button           | Style               |
| ---------------- | ------------------- |
| Scan Workspace   | Rounded capsule     |
| Regenerate Theme | Sparkle button      |
| Export Artwork   | Soft pastel outline |

Buttons should feel:

* candy-like
* tactile
* slightly elevated

---

# 7. Main Canvas — The Bead World

This is the centerpiece.

The workspace becomes:

# a living bead landscape

---

# Canvas Rendering Style

## Perspective

Recommended:

### Slight Isometric View

NOT flat 2D.

Something between:

* Stardew Valley
* Monument Valley
* mini tabletop diorama

Angle:

```txt
~20° isometric tilt
```

This creates:

* depth
* collectible toy feel
* visual richness

---

# 8. World Generation Rules

---

# Folder → Biome

Each folder becomes a region.

Example:

| Folder Type | Visual Biome          |
| ----------- | --------------------- |
| src         | pastel city           |
| models      | neural crystal forest |
| datasets    | bead desert           |
| docs        | floating library      |
| scripts     | machinery workshop    |
| configs     | shrine stones         |
| tests       | training arena        |

---

# Files → Structures

Each file becomes:

* house
* tree
* machine
* monument
* bead sculpture

based on semantic type.

---

# README.md

Always rendered as:

# Central Landmark

Possible forms:

* giant library
* glowing archive tower
* floating memory temple

---

# Git Activity

Recently modified files:

* sparkle animation
* moving glow
* warm lighting

Inactive files:

* faded pastel tones

---

# AI Generated Code

Special rendering:

* translucent beads
* subtle aura
* animated shimmer

---

# 9. Perler Bead Rendering System

This is the visual signature.

---

# Bead Style

Each tile is NOT a square pixel.

Each tile is:

# circular fused bead

Structure:

```txt
○ ○ ○
 ○ ○ ○
```

---

# Material Appearance

Beads should have:

* soft plastic reflections
* tiny inner shadow
* subtle melt fusion
* slight height variation

Avoid:

* perfect geometric rendering
* sharp edges

The world should feel handmade.

---

# 10. Scan Animation Sequence

Critical emotional moment.

---

# Scan Sequence

After workspace selection:

## Stage 1 — File Discovery

Tiny beads fall from top.

Folders bloom outward.

---

## Stage 2 — AI Interpretation

Soft light spreads across world.

Region names appear:

```txt
Generating Neural Forest...
Building Dataset Desert...
Constructing Documentation Temple...
```

---

## Stage 3 — World Assembly

Buildings rise from bead particles.

Ambient sound:

* soft clicks
* plastic bead sounds
* calming synth tones

---

# 11. Left Sidebar

Width: 280px

Floating translucent panel.

Rounded corners:
24px

---

# Sections

---

## Workspace Layers

Toggle visibility:

* folders
* git activity
* AI overlays
* dependency paths
* contributors

---

## Theme Generator

Dropdown:

| Theme             | Result                   |
| ----------------- | ------------------------ |
| Cozy Workshop     | warm wood tones          |
| Candy City        | playful pastel           |
| Neural Dream      | glowing AI fantasy       |
| Minimal Zen       | reduced structures       |
| Tiny Civilization | detailed miniature world |

---

## Density Slider

Controls:

* bead density
* structure complexity
* animation intensity

---

# 12. Hover Interactions

Essential for delight.

---

# Hovering a File

The structure softly bounces.

Tooltip appears:

```txt
train_model.py
Last modified: 2h ago
Commits: 18
AI-generated: 34%
```

Mini pixel preview shown.

---

# Hovering a Folder

Entire biome glows softly.

Ambient particles appear.

---

# 13. Clicking Objects

---

# File Click

Opens:

### Floating Bead Card

Style:

* layered paper card
* stitched corners
* soft shadows

Contains:

* filename
* metadata
* commit history
* semantic summary
* AI-generated description

---

# Folder Click

Zooms camera smoothly into biome.

Transition style:

* bead ripple expansion

NOT abrupt zoom.

---

# 14. Ambient Background Design

Background should feel alive.

---

# Dynamic Elements

Possible ambient visuals:

* floating dust particles
* drifting bead fragments
* slow cloud shadows
* tiny birds
* soft wind motion

Very subtle.

Never distracting.

---

# 15. Bottom Ambient Information Bar

Minimal and atmospheric.

Displays:

```txt
Workspace Mood: Calm Productivity
AI Structures Generated: 214
Active Regions: 8
Recent Commit Energy: Medium
```

Could also show:

* tiny waveform animation
* heartbeat-like git activity pulse

---

# 16. Typography

---

# Primary Font

Recommended:

* Inter Rounded
* Nunito
* DM Sans

---

# Headers

Soft bold.

No harsh black text.

Use:

```txt
#3D3A35
```

instead of pure black.

---

# 17. Animation Language

The app should never feel static.

---

# Motion Principles

Everything should:

* float slightly
* breathe gently
* wobble softly
* react physically

Avoid:

* fast UI motion
* sharp transitions
* aggressive animations

---

# Animation Examples

| Element   | Animation                   |
| --------- | --------------------------- |
| Beads     | tiny idle movement          |
| Buildings | slow breathing scale        |
| Hover     | bounce + glow               |
| Scan      | cascading particle assembly |
| Selection | warm expanding halo         |

---

# 18. Sound Design (Optional)

Subtle ASMR-like interaction sounds.

Examples:

* plastic bead clicks
* tiny ceramic taps
* paper movement
* soft synth ambience

Volume extremely low.

---

# 19. Export System

The generated world can be exported as:

| Format | Purpose                  |
| ------ | ------------------------ |
| PNG    | artwork                  |
| GIF    | animated world           |
| SVG    | printable bead template  |
| JSON   | world state              |
| PDF    | real-world bead assembly |

---

# 20. Recommended Frontend Stack

| Layer            | Technology    |
| ---------------- | ------------- |
| App Shell        | Tauri         |
| UI Framework     | React         |
| Renderer         | PixiJS        |
| Animation        | Framer Motion |
| State            | Zustand       |
| Styling          | TailwindCSS   |
| World Generation | Web Workers   |

---

# 21. Recommended Rendering Pipeline

```txt
Workspace Scan
    ↓
Semantic Analysis
    ↓
Biome Classification
    ↓
World Graph Generation
    ↓
Bead Tile Conversion
    ↓
PixiJS Scene Rendering
    ↓
Animation Layer
```

---

# 22. Future Expansion Ideas

---

# AI NPCs

Tiny pixel workers walking between folders.

---

# Live Git Weather

Heavy commit day:

* meteor shower
* glowing sky

---

# Multiplayer Mode

Collaborators appear as tiny travelers.

---

# Timeline Mode

See repository evolution as civilization growth.

---

# Dream Mode

AI hallucinates symbolic structures from code semantics.

Example:

* transformer model → giant neural cathedral

---

# 23. Emotional Design Goal

Users should feel:

```txt
“This is not just my codebase.
It feels like a tiny world I built.”
```
