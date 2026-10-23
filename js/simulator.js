/**
 * Simulator.js
 * 迷霧大賽機體感測與物理模擬 (修正版)
 */

export class DroneSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.maze = null;
    this.drone = { x: 0, y: 0, dirIndex: 1 };
    this.directions = [
      { name: 'NORTH', dx: 0, dy: -1 },
      { name: 'EAST', dx: 1, dy: 0 },
      { name: 'SOUTH', dx: 0, dy: 1 },
      { name: 'WEST', dx: -1, dy: 0 }
    ];
    this.fogMap = new Set();
    this.visitedCells = new Set();
    this.steps = 0;
    this.cellSize = 20;
    this.memory = {};
  }

  get x() { return this.drone.x; }
  get y() { return this.drone.y; }
  get heading() { return this.directions[this.drone.dirIndex].name; }

  init(maze) {
    if (!this.canvas) {
      this.canvas = document.getElementById('mazeCanvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');
    }
    this.maze = maze;
    this.drone.x = maze.start.x;
    this.drone.y = maze.start.y;
    this.drone.dirIndex = 1;
    this.memory = {};
    this.fogMap = new Set();
    this.visitedCells = new Set();
    this.visitedCells.add(this.drone.x + ',' + this.drone.y);
    this.steps = 0;

    this.resizeCanvas();
    this.revealFog();
    this.render();
  }

  resizeCanvas() {
    if (!this.maze || !this.canvas) return;
    this.cellSize = Math.floor(Math.min(520 / this.maze.cols, 520 / this.maze.rows));
    this.canvas.width = this.maze.cols * this.cellSize;
    this.canvas.height = this.maze.rows * this.cellSize;
  }

  revealFog() {
    if (!this.maze) return;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const rx = this.drone.x + dx;
        const ry = this.drone.y + dy;
        if (rx >= 0 && rx < this.maze.cols && ry >= 0 && ry < this.maze.rows) {
          this.fogMap.add(rx + ',' + ry);
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

  isWallInFront() { return this._isWall(0); }
  isWallRight() { return this._isWall(1); }
  isWallBack() { return this._isWall(2); }
  isWallLeft() { return this._isWall(3); }

  _isWall(offset) {
    if (!this.maze) return true;
    const dir = this.directions[(this.drone.dirIndex + offset) % 4];
    const nx = this.drone.x + dir.dx;
    const ny = this.drone.y + dir.dy;
    if (nx < 0 || nx >= this.maze.cols || ny < 0 || ny >= this.maze.rows) return true;
    return this.maze.grid[ny][nx] === 1;
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
      this.visitedCells.add(this.drone.x + ',' + this.drone.y);
      this.revealFog();
      return true;
    }
    return false;
  }

  isGoalReached() {
    if (!this.maze) return false;
    return this.drone.x === this.maze.end.x && this.drone.y === this.maze.end.y;
  }

  getDiscoveryRate() {
    if (!this.maze) return '0.0';
    return ((this.fogMap.size / (this.maze.cols * this.maze.rows)) * 100).toFixed(1);
  }

  render() {
    if (!this.maze || !this.ctx) return;
    const ctx = this.ctx;
    const cs = this.cellSize;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let r = 0; r < this.maze.rows; r++) {
      for (let c = 0; c < this.maze.cols; c++) {
        const key = c + ',' + r;
        if (!this.fogMap.has(key)) {
          ctx.fillStyle = '#070a14';
          ctx.fillRect(c * cs, r * cs, cs, cs);
        } else {
          if (this.maze.grid[r][c] === 1) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(c * cs, r * cs, cs, cs);
            ctx.strokeStyle = '#334155';
            ctx.strokeRect(c * cs, r * cs, cs, cs);
          } else {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(c * cs, r * cs, cs, cs);
          }
        }
      }
    }

    this.visitedCells.forEach((key) => {
      const parts = key.split(',');
      const vx = Number(parts[0]);
      const vy = Number(parts[1]);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.fillRect(vx * cs + 1, vy * cs + 1, cs - 2, cs - 2);
    });

    const endKey = this.maze.end.x + ',' + this.maze.end.y;
    if (this.fogMap.has(endKey)) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc((this.maze.end.x + 0.5) * cs, (this.maze.end.y + 0.5) * cs, cs * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate((this.drone.x + 0.5) * cs, (this.drone.y + 0.5) * cs);
    const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
    ctx.rotate(angles[this.drone.dirIndex]);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, 0, cs * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(cs * 0.35, 0);
    ctx.lineTo(cs * 0.1, -cs * 0.12);
    ctx.lineTo(cs * 0.1, cs * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
