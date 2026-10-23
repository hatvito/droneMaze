/**
 * Visualizer.js
 * 步進排程器與高亮繪製
 */

export class Visualizer {
  constructor(canvas, maze, drone) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.maze = maze;
    this.drone = drone;
    this.cellSize = 24;

    this.visitedGrid = [];
    this.solutionGrid = [];
    this.animId = null;
    this.speed = 30;
  }

  resize() {
    this.cellSize = Math.floor(Math.min(520 / this.maze.cols, 520 / this.maze.rows));
    this.canvas.width = this.maze.cols * this.cellSize;
    this.canvas.height = this.maze.rows * this.cellSize;
    this.resetOverlay();
  }

  resetOverlay() {
    this.visitedGrid = Array(this.maze.rows).fill(null).map(() => Array(this.maze.cols).fill(false));
    this.solutionGrid = Array(this.maze.rows).fill(null).map(() => Array(this.maze.cols).fill(false));
    this.drone.setPosition(this.maze.start.x, this.maze.start.y);
    this.drone.setHeading(0);
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const cs = this.cellSize;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let r = 0; r < this.maze.rows; r++) {
      for (let c = 0; c < this.maze.cols; c++) {
        if (this.maze.grid[r][c] === 1) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(c * cs, r * cs, cs, cs);
          ctx.strokeStyle = '#334155';
          ctx.strokeRect(c * cs, r * cs, cs, cs);
        } else {
          ctx.fillStyle = '#090d16';
          ctx.fillRect(c * cs, r * cs, cs, cs);

          if (this.visitedGrid[r][c]) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.fillRect(c * cs, r * cs, cs, cs);
          }
          if (this.solutionGrid[r][c]) {
            ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
            ctx.fillRect(c * cs, r * cs, cs, cs);
          }
        }
      }
    }

    this.drawPad(this.maze.start.x, this.maze.start.y, '#38bdf8', 'S');
    this.drawPad(this.maze.end.x, this.maze.end.y, '#ef4444', 'E');
    this.drone.render(ctx, cs);
  }

  drawPad(x, y, color, text) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const cx = (x + 0.5) * cs;
    const cy = (y + 0.5) * cs;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x * cs + 2, y * cs + 2, cs - 4, cs - 4);
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.floor(cs * 0.5)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }

  play(result, onProgress, onFinish) {
    this.stop();
    const { visitedOrder, solutionPath } = result;
    let vIdx = 0;
    let sIdx = 0;

    const step = () => {
      if (vIdx < visitedOrder.length) {
        const curr = visitedOrder[vIdx];
        this.visitedGrid[curr.y][curr.x] = true;
        this.drone.setPosition(curr.x, curr.y);
        if (vIdx > 0) {
          const prev = visitedOrder[vIdx - 1];
          this.drone.setHeading(Math.atan2(curr.y - prev.y, curr.x - prev.x));
        }
        vIdx++;
        if (onProgress) onProgress({ visitedCount: vIdx, pathCount: 0 });
        this.render();
        this.animId = setTimeout(step, this.speed);
      } else if (sIdx < solutionPath.length) {
        const curr = solutionPath[sIdx];
        this.solutionGrid[curr.y][curr.x] = true;
        this.drone.setPosition(curr.x, curr.y);
        if (sIdx > 0) {
          const prev = solutionPath[sIdx - 1];
          this.drone.setHeading(Math.atan2(curr.y - prev.y, curr.x - prev.x));
        }
        sIdx++;
        if (onProgress) onProgress({ visitedCount: visitedOrder.length, pathCount: sIdx });
        this.render();
        this.animId = setTimeout(step, Math.max(15, this.speed * 0.8));
      } else {
        this.stop();
        if (onFinish) onFinish();
      }
    };
    step();
  }

  stop() {
    if (this.animId) {
      clearTimeout(this.animId);
      this.animId = null;
    }
  }
}
