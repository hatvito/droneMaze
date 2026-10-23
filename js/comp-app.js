/**
 * comp-app.js
 * 專供 competition.html 使用的競賽控制器
 */

import { Maze } from './maze.js';
import { DroneSimulator } from './simulator.js';
import { ALGORITHM_TEMPLATES } from './templates.js';
import { BenchmarkEngine } from './benchmark.js';

class CompetitionApp {
  constructor() {
    this.maze = new Maze(21, 21, 2026);
    this.maze.generate('prim', 2026);

    this.simulator = new DroneSimulator('compCanvas');
    this.simulator.init(this.maze);

    this.editor = null;
    this.initEditor();
    this.bindEvents();
    this.updateTelemetry();
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

  updateTelemetry() {
    document.getElementById('comp-pos').textContent = '(' + this.simulator.drone.x + ', ' + this.simulator.drone.y + ')';
    document.getElementById('comp-dir').textContent = this.simulator.heading;
    document.getElementById('comp-steps').textContent = this.simulator.steps;
    document.getElementById('comp-discovery').textContent = this.simulator.getDiscoveryRate() + '%';
  }

  bindEvents() {
    document.getElementById('select-comp-template').addEventListener('change', (e) => {
      const key = e.target.value;
      if (ALGORITHM_TEMPLATES[key] && this.editor) {
        this.editor.setValue(ALGORITHM_TEMPLATES[key]);
      }
    });

    document.getElementById('btn-comp-reset').addEventListener('click', () => {
      this.simulator.init(this.maze);
      this.updateTelemetry();
    });

    document.getElementById('btn-comp-run').addEventListener('click', () => this.runCustomCode());
    document.getElementById('btn-comp-benchmark').addEventListener('click', () => this.runBenchmark());
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
