/**
 * learn-app.js
 * 專供 index.html 使用的教學控制器
 */

import { Maze } from './maze.js';
import { Drone } from './drone.js';
import { MazeAlgorithms } from './algorithms.js';
import { Visualizer } from './visualizer.js';

class LearnApp {
  constructor() {
    this.maze = new Maze(21, 21, 2026);
    this.maze.generate('prim', 2026);

    this.canvas = document.getElementById('mazeCanvas');
    this.drone = new Drone(this.maze.start.x, this.maze.start.y);
    this.visualizer = new Visualizer(this.canvas, this.maze, this.drone);

    this.bindEvents();
    this.visualizer.resize();
    this.visualizer.render();
  }

  bindEvents() {
    document.getElementById('btn-run-learn').addEventListener('click', () => this.runAlgorithm());
    document.getElementById('btn-reset-learn').addEventListener('click', () => {
      this.visualizer.stop();
      this.visualizer.resetOverlay();
      this.resetStats();
    });

    document.getElementById('select-learn-algo').addEventListener('change', () => {
      this.visualizer.stop();
      this.visualizer.resetOverlay();
      this.resetStats();
    });

    document.getElementById('select-maze-type').addEventListener('change', (e) => {
      this.visualizer.stop();
      if (e.target.value === 'simple') {
        this.maze.loadPreset('simple');
      } else {
        this.maze.cols = 21;
        this.maze.rows = 21;
        this.maze.generate('prim', Math.floor(Math.random() * 9999));
      }
      this.visualizer.resize();
      this.resetStats();
    });

    document.getElementById('learn-speed').addEventListener('input', (e) => {
      this.visualizer.speed = 105 - parseInt(e.target.value, 10);
    });
  }

  resetStats() {
    document.getElementById('stat-visited').textContent = '0';
    document.getElementById('stat-path').textContent = '0';
    document.getElementById('stat-time').textContent = '0 ms';
  }

  runAlgorithm() {
    this.visualizer.stop();
    this.visualizer.resetOverlay();
    this.resetStats();

    const algoKey = document.getElementById('select-learn-algo').value;
    const algoMap = {
      'righthand': MazeAlgorithms.solveRightHand,
      'dfs': MazeAlgorithms.solveDFS,
      'bfs': MazeAlgorithms.solveBFS,
      'astar': MazeAlgorithms.solveAStar
    };

    const fn = algoMap[algoKey];
    if (!fn) return;

    const t0 = performance.now();
    const result = fn(this.maze, this.maze.start, this.maze.end);
    const duration = (performance.now() - t0).toFixed(2);
    document.getElementById('stat-time').textContent = duration + ' ms';

    this.visualizer.play(
      result,
      (prog) => {
        document.getElementById('stat-visited').textContent = prog.visitedCount;
        if (prog.pathCount > 0) document.getElementById('stat-path').textContent = prog.pathCount;
      },
      () => {
        if (result.success) {
          document.getElementById('stat-path').textContent = result.solutionPath.length;
        }
      }
    );
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  new LearnApp();
});
