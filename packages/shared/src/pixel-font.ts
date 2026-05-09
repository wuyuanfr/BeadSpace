import type { BeadCell } from "./types.js";
import type { PerlerColor } from "./perler-palette.js";

export const FONT_GLYPH_WIDTH = 3;
export const FONT_GLYPH_HEIGHT = 5;
export const FONT_GLYPH_SPACING = 1;

const GLYPHS: Record<string, string[]> = {
  A: ["XXX", "X.X", "XXX", "X.X", "X.X"],
  B: ["XX.", "X.X", "XX.", "X.X", "XX."],
  C: [".XX", "X..", "X..", "X..", ".XX"],
  D: ["XX.", "X.X", "X.X", "X.X", "XX."],
  E: ["XXX", "X..", "XX.", "X..", "XXX"],
  F: ["XXX", "X..", "XX.", "X..", "X.."],
  G: [".XX", "X..", "X.X", "X.X", ".XX"],
  H: ["X.X", "X.X", "XXX", "X.X", "X.X"],
  I: ["XXX", ".X.", ".X.", ".X.", "XXX"],
  J: ["..X", "..X", "..X", "X.X", ".X."],
  K: ["X.X", "X.X", "XX.", "X.X", "X.X"],
  L: ["X..", "X..", "X..", "X..", "XXX"],
  M: ["X.X", "XXX", "XXX", "X.X", "X.X"],
  N: ["X.X", "XXX", "XXX", "XXX", "X.X"],
  O: [".X.", "X.X", "X.X", "X.X", ".X."],
  P: ["XX.", "X.X", "XX.", "X..", "X.."],
  Q: [".X.", "X.X", "X.X", "XX.", ".XX"],
  R: ["XX.", "X.X", "XX.", "X.X", "X.X"],
  S: [".XX", "X..", ".X.", "..X", "XX."],
  T: ["XXX", ".X.", ".X.", ".X.", ".X."],
  U: ["X.X", "X.X", "X.X", "X.X", ".X."],
  V: ["X.X", "X.X", "X.X", ".X.", ".X."],
  W: ["X.X", "X.X", "XXX", "XXX", "X.X"],
  X: ["X.X", "X.X", ".X.", "X.X", "X.X"],
  Y: ["X.X", "X.X", ".X.", ".X.", ".X."],
  Z: ["XXX", "..X", ".X.", "X..", "XXX"],

  "0": [".X.", "X.X", "X.X", "X.X", ".X."],
  "1": [".X.", "XX.", ".X.", ".X.", "XXX"],
  "2": ["XX.", "..X", ".X.", "X..", "XXX"],
  "3": ["XX.", "..X", "XX.", "..X", "XX."],
  "4": ["X.X", "X.X", "XXX", "..X", "..X"],
  "5": ["XXX", "X..", "XX.", "..X", "XX."],
  "6": [".XX", "X..", "XX.", "X.X", ".X."],
  "7": ["XXX", "..X", ".X.", "X..", "X.."],
  "8": [".X.", "X.X", ".X.", "X.X", ".X."],
  "9": [".X.", "X.X", ".XX", "..X", "XX."],

  ".": ["...", "...", "...", "...", "X.."],
  ",": ["...", "...", "...", ".X.", "X.."],
  "-": ["...", "...", "XXX", "...", "..."],
  _: ["...", "...", "...", "...", "XXX"],
  "/": ["..X", "..X", ".X.", "X..", "X.."],
  "\\": ["X..", "X..", ".X.", "..X", "..X"],
  "+": ["...", ".X.", "XXX", ".X.", "..."],
  "=": ["...", "XXX", "...", "XXX", "..."],
  "(": [".X.", "X..", "X..", "X..", ".X."],
  ")": [".X.", "..X", "..X", "..X", ".X."],
  "[": ["XX.", "X..", "X..", "X..", "XX."],
  "]": [".XX", "..X", "..X", "..X", ".XX"],
  "?": ["XX.", "..X", ".X.", "...", ".X."],
  "!": [".X.", ".X.", ".X.", "...", ".X."],
  "*": ["...", "X.X", ".X.", "X.X", "..."],
  "#": ["X.X", "XXX", "X.X", "XXX", "X.X"],
  "@": [".X.", "X.X", "XXX", "X..", ".XX"],
  "&": [".X.", "X.X", ".X.", "X.X", ".XX"],
  ":": ["...", ".X.", "...", ".X.", "..."],
  ";": ["...", ".X.", "...", ".X.", "X.."],
  "'": [".X.", ".X.", "...", "...", "..."],
  '"': ["X.X", "X.X", "...", "...", "..."],
  "<": ["..X", ".X.", "X..", ".X.", "..X"],
  ">": ["X..", ".X.", "..X", ".X.", "X.."],
  "~": ["...", ".X.", "X.X", "...", "..."],
  "`": ["X..", ".X.", "...", "...", "..."],
  "^": [".X.", "X.X", "...", "...", "..."],
  "%": ["X.X", "..X", ".X.", "X..", "X.X"],
  $: [".XX", "X.X", ".X.", "X.X", "XX."],
  " ": ["...", "...", "...", "...", "..."],
};

for (const ch of "abcdefghijklmnopqrstuvwxyz") {
  GLYPHS[ch] = GLYPHS[ch.toUpperCase()];
}

export interface LabelSprite {
  cells: BeadCell[];
  width: number;
  height: number;
}

export function renderLabel(
  text: string,
  color: PerlerColor = "black",
  originX = 0,
  originY = 0
): LabelSprite {
  const cells: BeadCell[] = [];
  let cursorX = 0;

  for (const ch of text) {
    const glyph = GLYPHS[ch] ?? GLYPHS["?"];
    for (let row = 0; row < FONT_GLYPH_HEIGHT; row++) {
      const line = glyph[row];
      for (let col = 0; col < FONT_GLYPH_WIDTH; col++) {
        if (line[col] === "X") {
          cells.push({
            dx: originX + cursorX + col,
            dy: originY + row,
            color,
          });
        }
      }
    }
    cursorX += FONT_GLYPH_WIDTH + FONT_GLYPH_SPACING;
  }

  const width = Math.max(0, cursorX - FONT_GLYPH_SPACING);
  return { cells, width, height: FONT_GLYPH_HEIGHT };
}

export function measureLabel(text: string): { width: number; height: number } {
  if (text.length === 0) return { width: 0, height: FONT_GLYPH_HEIGHT };
  return {
    width:
      text.length * FONT_GLYPH_WIDTH +
      (text.length - 1) * FONT_GLYPH_SPACING,
    height: FONT_GLYPH_HEIGHT,
  };
}

export function truncateToWidth(text: string, maxWidth: number): string {
  if (measureLabel(text).width <= maxWidth) return text;
  let cur = text;
  while (cur.length > 1 && measureLabel(cur).width > maxWidth) {
    cur = cur.slice(0, -1);
  }
  return cur;
}
