/**
 * DroneSimulator.js
 * 模擬機體、感測器讀取、迷霧（Fog of War）探索以及 Canvas 渲染繪製
 */

export class DroneSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    this.mazeData = null;
    this.gameMode = 'fog'; // 'known' 或 'fog'
    this.drone = {
      x: 0,
      y: 0,
      dirIndex: 0 // 0: NORTH, 1: EAST, 2: SOUTH, 3: WEST
    };
    this.memory = {};

    this.directions = [
      { name: 'NORTH', dx: 0, dy: -1 },
      { name: 'EAST', dx: 1, dy: 0 },
      { name: 'SOUTH', dx: 0, dy: 1 },
      { name: 'WEST', dx: -1, dy: 0 }
    ];

    this.fogMap = new Set();
    this.visitedCells = new Set();
    this.pathHistory = [];
    this.steps = 0;
    this.cellSize = 20;
    this.rotorAngle = 0;
  }

  get x() { return this.drone.x; }
  get y() { return this.drone.y; }
  get heading() { return this.directions[this.drone.dirIndex].name; }

  init(mazeData, mode = 'fog') {
    this.mazeData = mazeData;
    this.gameMode = mode;
    this.drone.x = mazeData.start.x;
    this.drone.y = mazeData.start.y;
    this.drone.dirIndex = 0;
    this.memory = {};

    this.fogMap = new Set();
    this.visitedCells = new Set();
    this.visitedCells.add(`${this.drone.x},${this.drone.y}`);
    this.pathHistory = [{ x: this.drone.x, y: this.drone.y }];
    this.steps = 0;

    this.revealSensorsFog();
    this.resizeCanvas();
    this.render();
  }

  resizeCanvas() {
    if (!this.mazeData) return;
    const maxDisplaySize = 460;
    this.cellSize = Math.floor(maxDisplaySize / Math.max(this.mazeData.width, this.mazeData.height));
    this.canvas.width = this.mazeData.width * this.cellSize;
    this.canvas.height = this.mazeData.height * this.cellSize;
  }

  revealSensorsFog() {
    // 揭露感測周圍 3x3 迷霧格子
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const rx = this.drone.x + dx;
        const ry = this.drone.y + dy;
        if (rx >= 0 && rx < this.mazeData.width && ry >= 0 && ry < this.mazeData.height) {
          this.fogMap.add(`${rx},${ry}`);
        }
      }
    }
  }

  getRelativePos(offsetStr) {
    let dirIdx = this.drone.dirIndex;
    if (offsetStr === 'RIGHT') dirIdx = (dirIdx + 1) % 4;
    else if (offsetStr === 'LEFT') dirIdx = (dirIdx + 3) % 4;
    else if (offsetStr === 'BACK') dirIdx = (dirIdx + 2) % 4;
    const d = this.directions[dirIdx];
    return { x: this.drone.x + d.dx, y: this.drone.y + d.dy };
  }

  getDirectionTo(targetPos) {
    if (targetPos.x > this.drone.x) return this.drone.dirIndex === 1 ? 'FORWARD' : 'RIGHT';
    if (targetPos.x < this.drone.x) return this.drone.dirIndex === 3 ? 'FORWARD' : 'LEFT';
    if (targetPos.y > this.drone.y) return this.drone.dirIndex === 2 ? 'FORWARD' : 'RIGHT';
    if (targetPos.y < this.drone.y) return this.drone.dirIndex === 0 ? 'FORWARD' : 'LEFT';
    return 'FORWARD';
  }

  isWallInFront() { return this._isWallOffset(0); }
  isWallRight() { return this._isWallOffset(1); }
  isWallBack() { return this._isWallOffset(2); }
  isWallLeft() { return this._isWallOffset(3); }

  _isWallOffset(offset) {
    const dir = this.directions[(this.drone.dirIndex + offset) % 4];
    const nx = this.drone.x + dir.dx;
    const ny = this.drone.y + dir.dy;
    if (nx < 0 || nx >= this.mazeData.width || ny < 0 || ny >= this.mazeData.height) return true;
    return this.mazeData.grid[ny][nx] === 1;
  }

  turnLeft() { this.drone.dirIndex = (this.drone.dirIndex + 3) % 4; }
  turnRight() { this.drone.dirIndex = (this.drone.dirIndex + 1) % 4; }
  uTurn() { this.drone.dirIndex = (this.drone.dirIndex + 2) % 4; }

  moveForward() {
    if (!this.isWallInFront()) {
      const dir = this.directions[this.drone.dirIndex];
      this.drone.x += dir.dx;
      this.drone.y += dir.dy;
      this.steps++;
      this.visitedCells.add(`${this.drone.x},${this.drone.y}`);
      this.pathHistory.push({ x: this.drone.x, y: this.drone.y });
      this.revealSensorsFog();
      return true;
    }
    return false;
  }

  isGoalReached() {
    return this.drone.x === this.mazeData.goal.x && this.drone.y === this.mazeData.goal.y;
  }

  getDiscoveryRate() {
    const totalPathable = this.mazeData.width * this.mazeData.height;
    return ((this.fogMap.size / totalPathable) * 100).toFixed(1);
  }

  render() {
    if (!this.mazeData) return;
    const ctx = this.ctx;
    const cs = this.cellSize;
    const grid = this.mazeData.grid;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. 繪製迷宮與迷霧圖層
    for (let y = 0; y < this.mazeData.height; y++) {
      for (let x = 0; x < this.mazeData.width; x++) {
        const key = `${x},${y}`;
        const isRevealed = this.gameMode === 'known' || this.fogMap.has(key);

        if (!isRevealed) {
          ctx.fillStyle = '#070a14'; // 迷霧遮罩
          ctx.fillRect(x * cs, y * cs, cs, cs);
          ctx.strokeStyle = '#0f172a';
          ctx.strokeRect(x * cs, y * cs, cs, cs);
        } else {
          if (grid[y][x] === 1) {
            ctx.fillStyle = '#1e293b'; // 障礙牆面
            ctx.fillRect(x * cs, y * cs, cs, cs);
            ctx.strokeStyle = '#334155';
            ctx.strokeRect(x * cs, y * cs, cs, cs);
          } else {
            ctx.fillStyle = '#0f172a'; // 通行空間
            ctx.fillRect(x * cs, y * cs, cs, cs);
          }
        }
      }
    }

    // 2. 探索熱區高亮
    this.visitedCells.forEach(key => {
      const [vx, vy] = key.split(',').map(Number);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.fillRect(vx * cs + 1, vy * cs + 1, cs - 2, cs - 2);
    });

    // 3. 軌跡線條
    if (this.pathHistory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = Math.max(2, cs / 5);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      this.pathHistory.forEach((pt, idx) => {
        const cx = pt.x * cs + cs / 2;
        const cy = pt.y * cs + cs / 2;
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    }

    // 4. 終點旗標 (若揭露或處於已知終點模式)
    const goalKey = `${this.mazeData.goal.x},${this.mazeData.goal.y}`;
    if (this.gameMode === 'known' || this.fogMap.has(goalKey)) {
      const gx = this.mazeData.goal.x * cs + cs / 2;
      const gy = this.mazeData.goal.y * cs + cs / 2;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(gx, gy, cs * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 5. 繪製無人機頂視機體
    const dx = this.drone.x * cs + cs / 2;
    const dy = this.drone.y * cs + cs / 2;

    ctx.save();
    ctx.translate(dx, dy);
    const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]; // 0: NORTH, 1: EAST, 2: SOUTH, 3: WEST
    ctx.rotate(angles[this.drone.dirIndex]);

    // 機架 X 軸
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = Math.max(2, cs / 8);
    ctx.beginPath();
    ctx.moveTo(-cs * 0.3, -cs * 0.3); ctx.lineTo(cs * 0.3, cs * 0.3);
    ctx.moveTo(cs * 0.3, -cs * 0.3); ctx.lineTo(-cs * 0.3, cs * 0.3);
    ctx.stroke();

    this.rotorAngle += 0.3;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.75)';
    [
      { x: -cs * 0.3, y: -cs * 0.3 }, { x: cs * 0.3, y: -cs * 0.3 },
      { x: -cs * 0.3, y: cs * 0.3 }, { x: cs * 0.3, y: cs * 0.3 }
    ].forEach(off => {
      ctx.beginPath();
      ctx.arc(off.x, off.y, cs * 0.15, 0, Math.PI * 2);
      ctx.fill();
    });

    // 中心圓頂
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, 0, cs * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // 機頭方向箭頭
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(cs * 0.32, 0);
    ctx.lineTo(cs * 0.1, -cs * 0.12);
    ctx.lineTo(cs * 0.1, cs * 0.12);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
