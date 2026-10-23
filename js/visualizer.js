/**
 * Visualizer.js
 * 動畫排程器、畫布渲染與走訪高亮
 */

class Visualizer {
  constructor(canvas, maze, drone) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.maze = maze;
    this.drone = drone;
    this.cellSize = 24;

    this.visitedGrid = [];
    this.solutionGrid = [];
    this.animId = null;
    this.speed = 30; // 動畫延遲 (ms)
    this.isPaused = false;
  }

  resize() {
    this.cellSize = Math.floor(Math.min(700 / this.maze.cols, 700 / this.maze.rows));
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

    // 1. 繪製迷宮基底與牆壁
    for (let r = 0; r < this.maze.rows; r++) {
      for (let c = 0; c < this.maze.cols; c++) {
        if (this.maze.grid[r][c] === 1) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(c * cs, r * cs, cs, cs);
          ctx.strokeStyle = '#334155';
          ctx.strokeRect(c * cs, r * cs, cs, cs);
        } else {
          // 通道底色
          ctx.fillStyle = '#090d16';
          ctx.fillRect(c * cs, r * cs, cs, cs);

          // 走訪過探索標記 (薄青色)
          if (this.visitedGrid[r][c]) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
            ctx.fillRect(c * cs, r * cs, cs, cs);
          }

          // 最優解/逃脫路徑標記 (亮金黃/霓虹綠)
          if (this.solutionGrid[r][c]) {
            ctx.fillStyle = 'rgba(34, 197, 94, 0.55)';
            ctx.fillRect(c * cs, r * cs, cs, cs);
          }
        }
      }
    }

    // 2. 標記起點與終點停機坪 (Landing Pad)
    this.drawPad(this.maze.start.x, this.maze.start.y, '#38bdf8', 'S');
    this.drawPad(this.maze.end.x, this.maze.end.y, '#ef4444', 'E');

    // 3. 繪製無人機
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

  // 執行步進動畫
  play(result, onProgress, onFinish) {
    this.stop();
    const { visitedOrder, solutionPath } = result;
    let vIdx = 0;
    let sIdx = 0;

    const step = () => {
      // 階段 1：播放探索過程
      if (vIdx < visitedOrder.length) {
        const curr = visitedOrder[vIdx];
        this.visitedGrid[curr.y][curr.x] = true;
        this.drone.setPosition(curr.x, curr.y);

        if (vIdx > 0) {
          const prev = visitedOrder[vIdx - 1];
          const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
          this.drone.setHeading(angle);
        }

        vIdx++;
        if (onProgress) onProgress({ visitedCount: vIdx, pathCount: 0 });
        this.render();
        this.animId = setTimeout(step, this.speed);
      } 
      // 階段 2：探索完成，無人機沿著最終解路徑巡航
      else if (sIdx < solutionPath.length) {
        const curr = solutionPath[sIdx];
        this.solutionGrid[curr.y][curr.x] = true;
        this.drone.setPosition(curr.x, curr.y);

        if (sIdx > 0) {
          const prev = solutionPath[sIdx - 1];
          const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
          this.drone.setHeading(angle);
        }

        sIdx++;
        if (onProgress) onProgress({ visitedCount: visitedOrder.length, pathCount: sIdx });
        this.render();
        this.animId = setTimeout(step, Math.max(15, this.speed * 0.8));
      } 
      // 完成
      else {
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
