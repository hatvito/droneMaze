/**
 * comp-app.js
 * 競賽控制器
 */

import { Maze } from './maze.js';
import { DroneSimulator } from './simulator.js';
import { ALGORITHM_TEMPLATES } from './templates.js';
import { BenchmarkEngine } from './benchmark.js';

class CompetitionApp {
  constructor() {
    this.gameMode = 'fog';
    this.maze = new Maze(15, 15, 2026);
    this.maze.generate('prim', 2026);

    this.simulator = new DroneSimulator('compCanvas');
    this.simulator.init(this.maze);
    this.simulator.gameMode = this.gameMode;

    this.editor = null;
    this.initEditor();
    this.bindEvents();
    this.rebuildMaze();
  }

  initEditor() {
    const el = document.getElementById('code-editor');
    if (!el) return;
    this.editor = CodeMirror.fromTextArea(el, {
      mode: 'javascript',
      theme: 'dracula',
      lineNumbers: true,
      indentUnit: 2,
      tabSize: 2,
      autoCloseBrackets: true
    });
    this.editor.setValue(ALGORITHM_TEMPLATES.tremaux_todo);
  }

  setGameMode(mode) {
    this.gameMode = mode;
    this.simulator.gameMode = mode;
    const btnKnown = document.getElementById('btn-mode-known');
    const btnFog = document.getElementById('btn-mode-fog');

    if (mode === 'known') {
      btnKnown.className = 'px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 bg-emerald-950 text-emerald-300 border border-emerald-700 shadow';
      btnFog.className = 'px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-slate-200';
    } else {
      btnFog.className = 'px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 bg-cyan-950 text-cyan-300 border border-cyan-700 shadow';
      btnKnown.className = 'px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-slate-200';
    }
    this.simulator.render();
  }

  rebuildMaze() {
    const size = parseInt(document.getElementById('select-maze-size').value, 10);
    const seed = parseInt(document.getElementById('input-seed').value, 10);
    const algo = document.getElementById('select-maze-algo').value;

    this.maze.cols = size;
    this.maze.rows = size;
    this.maze.generate(algo, seed);

    this.simulator.init(this.maze);
    this.simulator.gameMode = this.gameMode;
    this.updateTelemetry();
  }

  updateTelemetry() {
    document.getElementById('comp-pos').textContent = '(' + this.simulator.drone.x + ', ' + this.simulator.drone.y + ')';
    document.getElementById('comp-dir').textContent = this.simulator.heading;
    document.getElementById('comp-steps').textContent = this.simulator.steps;
    document.getElementById('comp-discovery').textContent = this.simulator.getDiscoveryRate() + '%';

    const setSensorUI = (id, isWall) => {
      const el = document.getElementById(id);
      if (isWall) {
        el.textContent = 'WALL';
        el.className = 'mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800';
      } else {
        el.textContent = 'CLEAR';
        el.className = 'mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800';
      }
    };

    setSensorUI('sensor-front', this.simulator.isWallInFront());
    setSensorUI('sensor-right', this.simulator.isWallRight());
    setSensorUI('sensor-back', this.simulator.isWallBack());
    setSensorUI('sensor-left', this.simulator.isWallLeft());
  }

  bindEvents() {
    document.getElementById('btn-mode-known').addEventListener('click', () => this.setGameMode('known'));
    document.getElementById('btn-mode-fog').addEventListener('click', () => this.setGameMode('fog'));

    document.getElementById('btn-rebuild-maze').addEventListener('click', () => this.rebuildMaze());
    document.getElementById('select-maze-size').addEventListener('change', () => this.rebuildMaze());
    document.getElementById('select-maze-algo').addEventListener('change', () => this.rebuildMaze());

    document.getElementById('btn-random-seed').addEventListener('click', () => {
      document.getElementById('input-seed').value = Math.floor(Math.random() * 90000) + 10000;
      this.rebuildMaze();
    });

    document.getElementById('select-comp-template').addEventListener('change', (e) => {
      const key = e.target.value;
      if (ALGORITHM_TEMPLATES[key] && this.editor) {
        this.editor.setValue(ALGORITHM_TEMPLATES[key]);
      }
    });

    document.getElementById('btn-comp-reset').addEventListener('click', () => {
      this.simulator.init(this.maze);
      this.simulator.gameMode = this.gameMode;
      this.updateTelemetry();
    });

    document.getElementById('btn-comp-run').addEventListener('click', () => this.runCustomCode());
    document.getElementById('btn-comp-benchmark').addEventListener('click', () => this.runBenchmark());
  }

  runCustomCode() {
    this.simulator.init(this.maze);
    this.simulator.gameMode = this.gameMode;
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
          this.updateTelemetry();
          setTimeout(loop, 40);
        } else if (this.simulator.isGoalReached()) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
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
  new CompetitionApp();
});
