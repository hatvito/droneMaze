/**
 * MazeGenerator.js
 * 提供可重現之種子亂數 (Seedable PRNG) 與 DFS / Prim 迷宮生成演算法
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

export class MazeGenerator {
  static generate(width, height, seed = 2026, algo = 'dfs') {
    if (width % 2 === 0) width++;
    if (height % 2 === 0) height++;

    const rng = new MathRandomSeed(seed);
    const grid = Array.from({ length: height }, () => Array(width).fill(1));

    if (algo === 'prim') {
      this._generatePrim(grid, width, height, rng);
    } else {
      this._generateDFS(grid, width, height, rng);
    }

    grid[1][1] = 0; // Goal (Top-Left)
    grid[height - 2][width - 2] = 0; // Start (Bottom-Right)

    return {
      grid,
      width,
      height,
      start: { x: width - 2, y: height - 2 },
      goal: { x: 1, y: 1 }
    };
  }

  static _generateDFS(grid, width, height, rng) {
    const stack = [{ x: 1, y: 1 }];
    grid[1][1] = 0;
    const dirs = [
      { x: 0, y: -2 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
      { x: -2, y: 0 }
    ];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = [];
      for (const d of dirs) {
        const nx = current.x + d.x,
          ny = current.y + d.y;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && grid[ny][nx] === 1) {
          neighbors.push({ x: nx, y: ny, dx: d.x / 2, dy: d.y / 2 });
        }
      }
      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(rng.next() * neighbors.length)];
        grid[current.y + next.dy][current.x + next.dx] = 0;
        grid[next.y][next.x] = 0;
        stack.push({ x: next.x, y: next.y });
      } else {
        stack.pop();
      }
    }
  }

  static _generatePrim(grid, width, height, rng) {
    grid[1][1] = 0;
    const walls = [];
    const addWalls = (x, y) => {
      if (x > 1) walls.push({ x1: x, y1: y, x2: x - 2, y2: y, wx: x - 1, wy: y });
      if (x < width - 2) walls.push({ x1: x, y1: y, x2: x + 2, y2: y, wx: x + 1, wy: y });
      if (y > 1) walls.push({ x1: x, y1: y, x2: x, y2: y - 2, wx: x, wy: y - 1 });
      if (y < height - 2) walls.push({ x1: x, y1: y, x2: x, y2: y + 2, wx: x, wy: y + 1 });
    };

    addWalls(1, 1);
    while (walls.length > 0) {
      const idx = Math.floor(rng.next() * walls.length);
      const w = walls.splice(idx, 1)[0];
      if (grid[w.y2][w.x2] === 1) {
        grid[w.wy][w.wx] = 0;
        grid[w.y2][w.x2] = 0;
        addWalls(w.x2, w.y2);
      }
    }
  }
}
