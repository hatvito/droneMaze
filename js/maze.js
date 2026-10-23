/**
 * Maze.js
 * 迷宮資料結構與地圖產生器
 */

export class MathRandomSeed {
  constructor(seed = 12345) {
    this.seed = seed;
  }
  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export class Maze {
  constructor(cols = 21, rows = 21, seed = 2026) {
    this.cols = cols % 2 === 0 ? cols + 1 : cols;
    this.rows = rows % 2 === 0 ? rows + 1 : rows;
    this.seed = seed;
    this.grid = [];
    this.start = { x: 1, y: 1 };
    this.end = { x: this.cols - 2, y: this.rows - 2 };
    this.initGrid();
  }

  initGrid() {
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(1));
  }

  isWalkable(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
    return this.grid[y][x] === 0;
  }

  generate(algo = 'prim', seed = 2026) {
    this.initGrid();
    const rng = new MathRandomSeed(seed);

    if (algo === 'dfs') {
      const stack = [{ x: 1, y: 1 }];
      this.grid[1][1] = 0;
      const dirs = [{ dx: 0, dy: -2 }, { dx: 2, dy: 0 }, { dx: 0, dy: 2 }, { dx: -2, dy: 0 }];

      while (stack.length > 0) {
        const curr = stack[stack.length - 1];
        const neighbors = [];
        for (const d of dirs) {
          const nx = curr.x + d.dx, ny = curr.y + d.dy;
          if (nx > 0 && nx < this.cols - 1 && ny > 0 && ny < this.rows - 1 && this.grid[ny][nx] === 1) {
            neighbors.push({ x: nx, y: ny, dx: d.dx / 2, dy: d.dy / 2 });
          }
        }
        if (neighbors.length > 0) {
          const next = neighbors[Math.floor(rng.next() * neighbors.length)];
          this.grid[curr.y + next.dy][curr.x + next.dx] = 0;
          this.grid[next.y][next.x] = 0;
          stack.push({ x: next.x, y: next.y });
        } else {
          stack.pop();
        }
      }
    } else {
      this.grid[1][1] = 0;
      const walls = [];
      const addWalls = (x, y) => {
        if (x > 1) walls.push({ x1: x, y1: y, x2: x - 2, y2: y, wx: x - 1, wy: y });
        if (x < this.cols - 2) walls.push({ x1: x, y1: y, x2: x + 2, y2: y, wx: x + 1, wy: y });
        if (y > 1) walls.push({ x1: x, y1: y, x2: x, y2: y - 2, wx: x, wy: y - 1 });
        if (y < this.rows - 2) walls.push({ x1: x, y1: y, x2: x, y2: y + 2, wx: x, wy: y + 1 });
      };
      addWalls(1, 1);
      while (walls.length > 0) {
        const idx = Math.floor(rng.next() * walls.length);
        const w = walls.splice(idx, 1)[0];
        if (this.grid[w.y2][w.x2] === 1) {
          this.grid[w.wy][w.wx] = 0;
          this.grid[w.y2][w.x2] = 0;
          addWalls(w.x2, w.y2);
        }
      }
    }

    this.start = { x: 1, y: 1 };
    this.end = { x: this.cols - 2, y: this.rows - 2 };
    this.grid[this.start.y][this.start.x] = 0;
    this.grid[this.end.y][this.end.x] = 0;
  }

  loadPreset(presetName) {
    if (presetName === 'simple') {
      this.cols = 9;
      this.rows = 9;
      this.grid = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1]
      ];
      this.start = { x: 1, y: 1 };
      this.end = { x: 7, y: 7 };
    } else {
      this.generate('prim', 2026);
    }
  }
}
