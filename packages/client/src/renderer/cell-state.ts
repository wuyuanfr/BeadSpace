export interface CellState {
  temperature: number;
  fused: boolean;
}

export const FUSE_THRESHOLD = 0.7;

const COLD: CellState = { temperature: 0, fused: false };

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export class CellStateMap {
  private data = new Map<string, CellState>();

  get(x: number, y: number): CellState {
    return this.data.get(cellKey(x, y)) ?? COLD;
  }

  heat(x: number, y: number, amount: number): boolean {
    const k = cellKey(x, y);
    let s = this.data.get(k);
    if (!s) {
      s = { temperature: 0, fused: false };
      this.data.set(k, s);
    }
    s.temperature = Math.min(1, s.temperature + amount);
    if (!s.fused && s.temperature >= FUSE_THRESHOLD) {
      s.fused = true;
      return true;
    }
    return false;
  }

  setAllCells(
    cells: { x: number; y: number }[],
    state: Partial<CellState>
  ): void {
    for (const c of cells) {
      const k = cellKey(c.x, c.y);
      let s = this.data.get(k);
      if (!s) {
        s = { temperature: 0, fused: false };
        this.data.set(k, s);
      }
      if (state.temperature !== undefined) s.temperature = state.temperature;
      if (state.fused !== undefined) s.fused = state.fused;
    }
  }

  reset(): void {
    this.data.clear();
  }
}
