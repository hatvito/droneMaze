/**
 * Maze.js
 * 迷宮資料結構與產生演算法
 * 0: 空地 (Path)
 * 1: 牆壁 (Wall)
 */

class Maze {
  constructor(cols = 21, rows = 21) {
    // 確保迷宮維度為奇數以利 Prim / DFS 迷宮生成
    this.cols = cols % 2 === 0 ? cols + 1 : cols;
    this.rows = rows % 2 === 0 ? rows + 1 : rows;
    this.grid = [];
    this.start = { x: 1, y: 1 };
    this.end = { x: this.cols - 2, y: this.rows - 2 };
    this.initGrid();
  }

  initGrid() {
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(1));
  }

  // 檢查座標是否合法且非障礙
  isWalkable(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
    return this.grid[y][x] === 0;
  }

  // 產生隨機迷宮 (使用 Randomized Prim Algorithm)
  generateRandom() {
    this.initGrid();

    // 隨機選擇起點雕鑿
    const startX = 1;
    const startY = 1;
    this.grid[startY][startX] = 0;

    const walls = [];

    const addWalls = (x, y) => {
      const directions = [
        { dx: 0, dy: -2 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 },
        { dx: 2, dy: 0 }
      ];
      for (const d of directions) {
        const nx = x + d.dx;
        const ny = y + d.dy;
        if (nx > 0 && nx < this.cols - 1 && ny > 0 && ny < this.rows - 1) {
          if (this.grid[ny][nx] === 1) {
            walls.push({ x: nx, y: ny, px: x, py: y });
          }
        }
      }
    };

    addWalls(startX, startY);

    while (walls.length > 0) {
      const randIndex = Math.floor(Math.random() * walls.length);
      const { x, y, px, py } = walls.splice(randIndex, 1)[0];

      if (this.grid[y][x] === 1) {
        this.grid[y][x] = 0;
        this.grid[(y + py) / 2][(x + px) / 2] = 0; // 打通中間隔牆
        addWalls(x, y);
      }
    }

    this.start = { x: 1, y: 1 };
    this.end = { x: this.cols - 2, y: this.rows - 2 };
    this.grid[this.start.y][this.start.x] = 0;
    this.grid[this.end.y][this.end.x] = 0;
  }

  // 載入預設教學關卡
  loadPreset(presetName) {
    if (presetName === 'simple') {
      // 9x9 基礎 S 型轉彎迷宮
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
    } else if (presetName === 'loops') {
      // 帶有多路徑與迴圈的迷宮 (測試 BFS vs DFS 最短路徑)
      this.cols = 13;
      this.rows = 13;
      this.initGrid();
      this.generateRandom();
      // 隨機打穿數個牆壁製造環路
      for (let i = 0; i < 6; i++) {
        const rx = 1 + Math.floor(Math.random() * (this.cols - 2));
        const ry = 1 + Math.floor(Math.random() * (this.rows - 2));
        this.grid[ry][rx] = 0;
      }
    } else {
      // 預設標準迷宮
      this.cols = 21;
      this.rows = 21;
      this.generateRandom();
    }
  }
}
