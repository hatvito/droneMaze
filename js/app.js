/**
 * App.js
 * 整合控制器 (修正版)
 */

import { Maze } from './maze.js';
import { Drone } from './drone.js';
import { MazeAlgorithms } from './algorithms.js';
import { Visualizer } from './visualizer.js';
import { DroneSimulator } from './simulator.js';
import { ALGORITHM_TEMPLATES } from './templates.js';
import { BenchmarkEngine } from './benchmark.js';

export class App {
  constructor() {
    this.currentTab = 'learn';
    this.maze = new Maze(21, 21, 2026);
    this.maze.generate('prim', 2026);

    this.canvas = document.getElementById('mazeCanvas');
    this.drone = new Drone(this.maze.start.x, this.maze.start.y);
    this.visualizer = new Visualizer(this.canvas, this.maze, this.drone);
    this.simulator = new DroneSimulator('mazeCanvas');

    this.editor = null;
    this.initEditor();
    this.bindEvents();
    
    // 初始化直接載入並繪製第一幕教學
    this.switchTab('learn');
  }

  initEditor() {
    const editorEl = document.getElementById('code-editor');
    if (!editorEl) return;
    this.editor = CodeMirror.fromTextArea(editorEl, {
      mode: 'javascript',
      theme: 'dracula',
      lineNumbers: true,
      indentUnit: 2,
      tabSize: 2,
      autoCloseBrackets: true
    });
    this.editor.setValue(ALGORITHM_TEMPLATES.tremaux_todo);
  }

  bindEvents() {
    document.getElementById('tab-learn').addEventListener('click', () => this.switchTab('learn'));
    document.getElementById('tab-code').addEventListener('click', () => this.switchTab('code'));
    document.getElementById('tab-comp').addEventListener('click', () => this.switchTab('competition'));

    document.getElementById('btn-run-learn').addEventListener('click', () => this.runLearningAlgorithm());
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

    document.getElementById('select-code-template').addEventListener('change', (e) => {
      const key = e.target.value;
      if (ALGORITHM_TEMPLATES[key] && this.editor) {
        this.editor.setValue(ALGORITHM_TEMPLATES[key]);
      }
    });

    document.getElementById('btn-run-code').addEventListener('click', () => this.runCustomCode());
    document.getElementById('btn-run-benchmark').addEventListener('click', () => this.runBenchmark());
  }

  switchTab(tab) {
    this.currentTab = tab;
    this.visualizer.stop();

    const panelLearn = document.getElementById('panel-learn');
    const panelCode = document.getElementById('panel-code');
    const panelComp = document.getElementById('panel-comp');

    const tabLearn = document.getElementById('tab-learn');
    const tabCode = document.getElementById('tab-code');
    const tabComp = document.getElementById('tab-comp');

    [panelLearn, panelCode, panelComp].forEach(el => el.classList.add('hidden'));
    [tabLearn, tabCode, tabComp].forEach(el => {
      el.className = 'px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 transition border border-transparent';
    });

    if (tab === 'learn') {
      panelLearn.classList.remove('hidden');
      panelLearn.classList.add('grid');
      tabLearn.className = 'px-4 py-2 rounded-lg text-sm font-medium bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40 shadow';
      this.visualizer.resize();
      this.visualizer.render();
    } else if (tab === 'code') {
      panelCode.classList.remove('hidden');
      panelCode.classList.add('grid');
      tabCode.className = 'px-4 py-2 rounded-lg text-sm font-medium bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40 shadow';
      this.simulator.init(this.maze);
      if (this.editor) this.editor.refresh();
    } else if (tab === 'competition') {
      panelComp.classList.remove('hidden');
      panelComp.classList.add('flex');
      tabComp.className = 'px-4 py-2 rounded-lg text-sm font-medium bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40 shadow';
    }
  }

  resetStats() {
    document.getElementById('stat-visited').textContent = '0';
    document.getElementById('stat-path').textContent = '0';
    document.getElementById('stat-time').textContent = '0 ms';
  }

  runLearningAlgorithm() {
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

  runCustomCode() {
    this.simulator.init(this.maze);
    const code = this.editor.getValue();
    try {
      const fn = new Function(code + '\n return nextAction;')();
      let steps = 0;
      const maxSteps = 1500;

      const loop = () => {
        if (!this.simulator.isGoalReached() && steps < maxSteps) {
          const act = fn(this.simulator);
          if (act === 'FORWARD') this.simulator.moveForward();
          else if (act === 'LEFT') { this.simulator.turnLeft(); this.simulator.moveForward(); }
          else if (act === 'RIGHT') { this.simulator.turnRight(); this.simulator.moveForward(); }
          else if (act === 'U_TURN') { this.simulator.uTurn(); this.simulator.moveForward(); }
          steps++;
          this.simulator.render();
          setTimeout(loop, 40);
        } else if (this.simulator.isGoalReached()) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      };
      loop();
    } catch (err) {
      alert('語法或執行錯誤: ' + err.message);
    }
  }

  runBenchmark() {
    const tbody = document.getElementById('benchmark-body');
    tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-sky-400 animate-pulse">評測運行中...</td></tr>';

    const customCode = this.editor.getValue();
    const results = BenchmarkEngine.run(this.maze, customCode);

    tbody.innerHTML = '';
    results.forEach((res, idx) => {
      const tr = document.createElement('tr');
      tr.className = idx === 0 ? 'bg-emerald-950/30 font-bold' : 'hover:bg-slate-900/50';
      const rank = idx === 0 ? '🥇 冠軍' : idx === 1 ? '🥈 亞軍' : idx === 2 ? '🥉 季軍' : (idx + 1);
      const status = res.success
        ? '<span class="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded text-xs border border-emerald-800">成功脫逃</span>'
        : '<span class="text-red-400 bg-red-950 px-2 py-0.5 rounded text-xs border border-red-800">失敗/超時</span>';

      const score = res.success ? Math.max(10, 1000 - res.steps * 3 - Math.floor(res.time)) : 0;

      tr.innerHTML = `
        <td class="p-3 text-center">${rank}</td>
        <td class="p-3 text-sky-300">${res.name}</td>
        <td class="p-3 text-center">${status}</td>
        <td class="p-3 text-right text-cyan-400">${res.discovery}%</td>
        <td class="p-3 text-right">${res.steps} 步</td>
        <td class="p-3 text-right text-amber-400">${res.time.toFixed(2)} ms</td>
        <td class="p-3 text-center text-emerald-400">${score} 分</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  window.app = new App();
});
