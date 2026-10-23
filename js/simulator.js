/**
 * Simulator.js
 * 迷霧大賽機體感測與物理模擬
 */

export class DroneSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.maze = null;
    this.drone = { x: 0, y: 0, dirIndex: 0 };
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
    this.maze = maze;
    this.drone.x = maze.start.x;
    this.drone.y = maze.start.y;
    this.drone.dirIndex = 1;
    this.memory = {};
    this.fogMap = new Set();
    this.visitedCells = new Set();
    this.visitedCells.add(`${this.drone.x},${this.drone.y}`); this.steps = 0; this.revealFog(); this.resizeCanvas(); this.render(); }  resizeCanvas() { if (!this.maze) return; this.cellSize = Math.floor(Math.min(520 / this.maze.cols, 520 / this.maze.rows)); this.canvas.width = this.maze.cols * this.cellSize; this.canvas.height = this.maze.rows * this.cellSize; }  revealFog() { for (let dy = -1; dy <= 1; dy++) { for (let dx = -1; dx <= 1; dx++) { const rx = this.drone.x + dx, ry = this.drone.y + dy; if (rx >= 0 && rx < this.maze.cols && ry >= 0 && ry < this.maze.rows) { this.fogMap.add(`${rx},${ry}`); } } } }  getRelativePos(offsetStr) { let dirIdx = this.drone.dirIndex; if (offsetStr === 'RIGHT') dirIdx = (dirIdx + 1) \% 4; else if (offsetStr === 'LEFT') dirIdx = (dirIdx + 3) \% 4; else if (offsetStr === 'BACK') dirIdx = (dirIdx + 2) \% 4; const d = this.directions[dirIdx]; return { x: this.drone.x + d.dx, y: this.drone.y + d.dy }; }  getDirectionTo(targetPos) { if (targetPos.x > this.drone.x) return this.drone.dirIndex === 1 ? 'FORWARD' : 'RIGHT'; if (targetPos.x < this.drone.x) return this.drone.dirIndex === 3 ? 'FORWARD' : 'LEFT'; if (targetPos.y > this.drone.y) return this.drone.dirIndex === 2 ? 'FORWARD' : 'RIGHT'; if (targetPos.y < this.drone.y) return this.drone.dirIndex === 0 ? 'FORWARD' : 'LEFT'; return 'FORWARD'; }  isWallInFront() { return this._isWall(0); } isWallRight() { return this._isWall(1); } isWallBack() { return this._isWall(2); } isWallLeft() { return this._isWall(3); }  _isWall(offset) { const dir = this.directions[(this.drone.dirIndex + offset) \% 4]; const nx = this.drone.x + dir.dx, ny = this.drone.y + dir.dy; if (nx < 0 \vert{}\vert{} nx >= this.maze.cols \vert{}\vert{} ny < 0 \vert{}\vert{} ny >= this.maze.rows) return true; return this.maze.grid[ny][nx] === 1; }  turnLeft() { this.drone.dirIndex = (this.drone.dirIndex + 3) \% 4; } turnRight() { this.drone.dirIndex = (this.drone.dirIndex + 1) \% 4; } uTurn() { this.drone.dirIndex = (this.drone.dirIndex + 2) \% 4; }  moveForward() { if (!this.isWallInFront()) { const dir = this.directions[this.drone.dirIndex]; this.drone.x += dir.dx; this.drone.y += dir.dy; this.steps++; this.visitedCells.add(`${this.drone.x},${this.drone.y}`); this.revealFog(); return true; } return false; }  isGoalReached() { return this.drone.x === this.maze.end.x && this.drone.y === this.maze.end.y; }  getDiscoveryRate() { return ((this.fogMap.size / (this.maze.cols * this.maze.rows)) * 100).toFixed(1); }  render() { if (!this.maze) return; const ctx = this.ctx; const cs = this.cellSize;  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);  for (let r = 0; r < this.maze.rows; r++) { for (let c = 0; c < this.maze.cols; c++) { const key = `${c},${r}`; if (!this.fogMap.has(key)) { ctx.fillStyle = '#070a14'; ctx.fillRect(c * cs, r * cs, cs, cs); } else { if (this.maze.grid[r][c] === 1) { ctx.fillStyle = '#1e293b'; ctx.fillRect(c * cs, r * cs, cs, cs); ctx.strokeStyle = '#334155'; ctx.strokeRect(c * cs, r * cs, cs, cs); } else { ctx.fillStyle = '#0f172a'; ctx.fillRect(c * cs, r * cs, cs, cs); } } } }  this.visitedCells.forEach(key => { const [vx, vy] = key.split(',').map(Number); ctx.fillStyle = 'rgba(6, 182, 212, 0.25)'; ctx.fillRect(vx * cs + 1, vy * cs + 1, cs - 2, cs - 2); });  const endKey = `${this.maze.end.x},${this.maze.end.y}`; if (this.fogMap.has(endKey)) { ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc((this.maze.end.x + 0.5) * cs, (this.maze.end.y + 0.5) * cs, cs * 0.35, 0, Math.PI * 2); ctx.fill(); }  ctx.save(); ctx.translate((this.drone.x + 0.5) * cs, (this.drone.y + 0.5) * cs); const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]; ctx.rotate(angles[this.drone.dirIndex]); ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(0, 0, cs * 0.25, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.moveTo(cs * 0.35, 0); ctx.lineTo(cs * 0.1, -cs * 0.12); ctx.lineTo(cs * 0.1, cs * 0.12); ctx.closePath(); ctx.fill(); ctx.restore(); } } ```  ---  ### 9. `js/benchmark.js`  ```javascript /** * Benchmark.js * 迷宮大賽排行榜評測引擎 */  import { DroneSimulator } from './simulator.js'; import { ALGORITHM_TEMPLATES } from './templates.js';  export class BenchmarkEngine { static run(maze, customCode) { const strategies = [ { name: '特雷莫演算法 (Trémaux)', code: ALGORITHM_TEMPLATES.tremaux }, { name: '增量 DFS 記憶探索', code: ALGORITHM_TEMPLATES.incrementalDfs }, { name: '沿牆搜尋法 (Right-Hand)', code: ALGORITHM_TEMPLATES.rightHand }, { name: '★ 自訂編輯器策略', code: customCode } ];  const results = [];  strategies.forEach(item => { const sim = new DroneSimulator('mazeCanvas'); sim.init(maze);  const t0 = performance.now(); let steps = 0; const maxSteps = 1500;  try { const fn = new Function(`${item.code}\n return nextAction;`)();
        while (!sim.isGoalReached() && steps < maxSteps) {
          const act = fn(sim);
          if (act === 'FORWARD') sim.moveForward();
          else if (act === 'LEFT') { sim.turnLeft(); sim.moveForward(); }
          else if (act === 'RIGHT') { sim.turnRight(); sim.moveForward(); }
          else if (act === 'U_TURN') { sim.uTurn(); sim.moveForward(); }
          steps++;
        }
        const t1 = performance.now();
        results.push({
          name: item.name,
          time: t1 - t0,
          steps: sim.steps,
          discovery: sim.getDiscoveryRate(),
          success: sim.isGoalReached()
        });
      } catch (e) {
        results.push({
          name: item.name,
          time: 0,
          steps: 0,
          discovery: 0,
          success: false,
          error: e.message
        });
      }
    });

    results.sort((a, b) => {
      if (a.success !== b.success) return b.success - a.success;
      if (a.steps !== b.steps) return a.steps - b.steps;
      return a.time - b.time;
    });

    return results;
  }
}
