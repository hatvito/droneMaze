/**
 * App.js
 * 主控制器：綁定介面事件、代碼編輯器、單步排程與榜單渲染
 */

import { MazeGenerator } from './mazeGenerator.js';
import { DroneSimulator } from './droneSimulator.js';
import { ALGORITHM_TEMPLATES } from './templates.js';
import { BenchmarkEngine } from './benchmark.js';

export class AppController {
  constructor() {
    this.mazeData = null;
    this.gameMode = 'fog'; // 'known' or 'fog'
    this.editor = null;
    this.simulator = new DroneSimulator('drone-canvas');

    this.isRunning = false;
    this.isPaused = false;
    this.animationTimer = null;
    this.planPathQueue = [];
    this.startTime = 0;

    this.initCodeEditor();
    this.bindEvents();
    this.rebuildMaze();
  }

  initCodeEditor() {
    this.editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
      mode: 'javascript',
      theme: 'dracula',
      lineNumbers: true,
      indentUnit: 2,
      tabSize: 2,
      autoCloseBrackets: true
    });
    this.editor.setValue(ALGORITHM_TEMPLATES.tremaux);
  }

  logConsole(msg, type = 'info') {
    const consoleEl = document.getElementById('console-log');
    const entry = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();

    if (type === 'error') entry.className = 'text-red-400 font-semibold';
    else if (type === 'success') entry.className = 'text-emerald-400 font-semibold';
    else entry.className = 'text-slate-300';

    entry.textContent = `[${timestamp}] ${msg}`;
    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  setGameMode(mode) {
    this.gameMode = mode;
    const btnKnown = document.getElementById('btn-mode-known');
    const btnFog = document.getElementById('btn-mode-fog');
    const goalBadge = document.getElementById('badge-goal-text');

    if (mode === 'known') {
      btnKnown.className = 'px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 bg-emerald-950 text-emerald-300 border border-emerald-700 shadow';
      btnFog.className = 'px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-slate-200';
      goalBadge.textContent = '終點: (1, 1) 已知';
      this.editor.setValue(ALGORITHM_TEMPLATES.astar);
    } else {
      btnFog.className = 'px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 bg-cyan-950 text-cyan-300 border border-cyan-700 shadow';
      btnKnown.className = 'px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-slate-200';
      goalBadge.textContent = '終點: 未知 (探索中)';
      this.editor.setValue(ALGORITHM_TEMPLATES.tremaux);
    }

    this.rebuildMaze();
  }

  rebuildMaze() {
    this.stopSimulation();
    const size = parseInt(document.getElementById('select-maze-size').value, 10);
    const seed = parseInt(document.getElementById('input-seed').value, 10);
    const algo = document.getElementById('select-maze-algo').value;

    this.mazeData = MazeGenerator.generate(size, size, seed, algo);
    this.simulator.init(this.mazeData, this.gameMode);
    this.updateTelemetry();
    this.logConsole(`迷宮成功重置: 模式 [${this.gameMode.toUpperCase()}], 尺寸 ${size}x${size}, 種子 ${seed}`);
  }

  updateTelemetry(executionTime = 0) {
    document.getElementById('telemetry-pos').textContent = `(${this.simulator.drone.x}, ${this.simulator.drone.y})`;
    document.getElementById('telemetry-dir').textContent = this.simulator.heading;
    document.getElementById('telemetry-steps').textContent = this.simulator.steps;
    document.getElementById('telemetry-time').textContent = `${executionTime.toFixed(1)} ms`;

    const rate = this.simulator.getDiscoveryRate();
    document.getElementById('telemetry-discovery').textContent = `${rate}%`;
    document.getElementById('discovery-bar').style.width = `${rate}%`;

    const formatSensor = (elId, isWall) => {
      const el = document.getElementById(elId);
      if (isWall) {
        el.textContent = 'WALL';
        el.className = 'mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800';
      } else {
        el.textContent = 'CLEAR';
        el.className = 'mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800';
      }
    };

    formatSensor('sensor-front', this.simulator.isWallInFront());
    formatSensor('sensor-right', this.simulator.isWallRight());
    formatSensor('sensor-back', this.simulator.isWallBack());
    formatSensor('sensor-left', this.simulator.isWallLeft());
  }

  bindEvents() {
    document.getElementById('btn-mode-known').addEventListener('click', () => this.setGameMode('known'));
    document.getElementById('btn-mode-fog').addEventListener('click', () => this.setGameMode('fog'));

    document.getElementById('btn-tab-single').addEventListener('click', () => this.switchTab('single'));
    document.getElementById('btn-tab-benchmark').addEventListener('click', () => this.switchTab('benchmark'));

    document.getElementById('btn-rebuild-maze').addEventListener('click', () => this.rebuildMaze());
    document.getElementById('btn-random-seed').addEventListener('click', () => {
      document.getElementById('input-seed').value = Math.floor(Math.random() * 90000) + 10000;
      this.rebuildMaze();
    });

    document.getElementById('select-algo-template').addEventListener('change', (e) => {
      const algoKey = e.target.value;
      if (ALGORITHM_TEMPLATES[algoKey]) {
        this.editor.setValue(ALGORITHM_TEMPLATES[algoKey]);
        this.logConsole(`載入範本策略: ${e.target.options[e.target.selectedIndex].text}`);
      }
    });

    document.getElementById('input-speed').addEventListener('input', (e) => {
      document.getElementById('speed-label').textContent = `${e.target.value} FPS`;
    });

    document.getElementById('btn-run').addEventListener('click', () => this.startSimulation());
    document.getElementById('btn-pause').addEventListener('click', () => this.pauseSimulation());
    document.getElementById('btn-step').addEventListener('click', () => this.stepSimulation());
    document.getElementById('btn-reset').addEventListener('click', () => {
      this.stopSimulation();
      this.simulator.init(this.mazeData, this.gameMode);
      this.updateTelemetry();
      this.logConsole('已回到起點。');
    });

    document.getElementById('btn-open-rules').addEventListener('click', () => {
      document.getElementById('modal-rules').classList.remove('hidden');
    });
    document.getElementById('btn-close-modal').addEventListener('click', () => {
      document.getElementById('modal-rules').classList.add('hidden');
    });
    document.getElementById('btn-modal-ok').addEventListener('click', () => {
      document.getElementById('modal-rules').classList.add('hidden');
    });

    document.getElementById('btn-run-benchmark').addEventListener('click', () => this.runBenchmark());
  }

  switchTab(tab) {
    const singleView = document.getElementById('view-single');
    const benchView = document.getElementById('view-benchmark');
    const btnSingle = document.getElementById('btn-tab-single');
    const btnBench = document.getElementById('btn-tab-benchmark');

    if (tab === 'single') {
      singleView.classList.remove('hidden');
      benchView.classList.add('hidden');
      btnSingle.className = 'tab-btn px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40';
      btnBench.className = 'tab-btn px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2 border border-transparent';
    } else {
      singleView.classList.add('hidden');
      benchView.classList.remove('hidden');
      btnBench.className = 'tab-btn px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40';
      btnSingle.className = 'tab-btn px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2 border border-transparent';
    }
  }

  startSimulation() {
    if (this.isRunning && !this.isPaused) return;

    if (!this.isPaused) {
      this.stopSimulation();
      this.simulator.init(this.mazeData, this.gameMode);
      this.planPathQueue = [];
      this.startTime = performance.now();

      const code = this.editor.getValue();
      try {
        const userScript = new Function(
          `${code}\n return { nextAction: typeof nextAction !== 'undefined' ? nextAction : null, planPath: typeof planPath !== 'undefined' ? planPath : null };`
        )();

        if (userScript.planPath) {
          if (this.gameMode === 'fog') {
            this.logConsole('警告：迷霧/未知終點模式下無法使用全圖 planPath，請切換回 nextAction。', 'error');
            return;
          }
          const t0 = performance.now();
          const fullPath = userScript.planPath(this.mazeData.grid, this.mazeData.start, this.mazeData.goal);
          const calcTime = performance.now() - t0;

          if (Array.isArray(fullPath) && fullPath.length > 0) {
            this.planPathQueue = fullPath.slice(1);
            this.logConsole(`全圖路徑規劃成功！總長度: ${fullPath.length}，耗時: ${calcTime.toFixed(2)} ms`, 'success');
          } else {
            this.logConsole('規劃失敗：無法找到可到達終點的路徑！', 'error');
            return;
          }
        } else if (userScript.nextAction) {
          this.userNextAction = userScript.nextAction;
          this.logConsole('步進探索策略已成功編譯與掛載！', 'success');
        }
      } catch (err) {
        this.logConsole(`編譯/執行錯誤: ${err.message}`, 'error');
        return;
      }
    }

    this.isRunning = true;
    this.isPaused = false;
    document.getElementById('btn-run').disabled = true;
    document.getElementById('btn-pause').disabled = false;

    this.loop();
  }

  pauseSimulation() {
    this.isPaused = true;
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-pause').disabled = true;
  }

  stopSimulation() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationTimer) clearTimeout(this.animationTimer);
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-pause').disabled = true;
  }

  stepSimulation() {
    if (this.simulator.isGoalReached()) return;

    if (this.planPathQueue.length > 0) {
      const target = this.planPathQueue.shift();
      this.simulator.drone.x = target.x;
      this.simulator.drone.y = target.y;
      this.simulator.steps++;
      this.simulator.visitedCells.add(`${target.x},${target.y}`);
      this.simulator.pathHistory.push({ x: target.x, y: target.y });
      this.simulator.revealSensorsFog();
    } else if (this.userNextAction) {
      try {
        const action = this.userNextAction(this.simulator);
        if (action === 'FORWARD') this.simulator.moveForward();
        else if (action === 'LEFT') { this.simulator.turnLeft(); this.simulator.moveForward(); }
        else if (action === 'RIGHT') { this.simulator.turnRight(); this.simulator.moveForward(); }
        else if (action === 'U_TURN') { this.simulator.uTurn(); this.simulator.moveForward(); }
      } catch (e) {
        this.logConsole(`策略執行異常: ${e.message}`, 'error');
        this.stopSimulation();
        return;
      }
    }

    const elapsed = performance.now() - this.startTime;
    this.simulator.render();
    this.updateTelemetry(elapsed);

    if (this.simulator.isGoalReached()) {
      this.stopSimulation();
      this.logConsole(`🎉 任務完成！無人機成功抵達出口！步數: ${this.simulator.steps}，開圖率: ${this.simulator.getDiscoveryRate()}%`, 'success');
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }

  loop() {
    if (!this.isRunning || this.isPaused) return;

    this.stepSimulation();

    if (this.isRunning && !this.simulator.isGoalReached()) {
      const speed = parseInt(document.getElementById('input-speed').value, 10);
      const interval = Math.max(10, 1000 / speed);
      this.animationTimer = setTimeout(() => this.loop(), interval);
    }
  }

  runBenchmark() {
    const tbody = document.getElementById('benchmark-results-body');
    tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-sky-400 animate-pulse">評測進行中：正在迷霧條件下運行全數演算法...</td></tr>';

    const customCode = this.editor.getValue();
    const results = BenchmarkEngine.run(this.mazeData, this.gameMode, customCode);

    tbody.innerHTML = '';
    results.forEach((res, index) => {
      const tr = document.createElement('tr');
      tr.className = index === 0 ? 'bg-emerald-950/30 font-bold' : 'hover:bg-slate-900/50';

      const rankBadge = index === 0 ? '🥇 冠軍' : index === 1 ? '🥈 亞軍' : index === 2 ? '🥉 季軍' : `${index + 1}`;
      const statusBadge = res.success
        ? '<span class="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded text-xs border border-emerald-800">成功尋獲</span>'
        : '<span class="text-red-400 bg-red-950 px-2 py-0.5 rounded text-xs border border-red-800">未抵達/超時</span>';

      const score = res.success ? Math.max(10, 1000 - res.steps * 3 - Math.floor(res.time)) : 0;

      tr.innerHTML = `
        <td class="p-3 text-center">${rankBadge}</td>
        <td class="p-3 text-sky-300 font-semibold">${res.name}</td>
        <td class="p-3 text-center">${statusBadge}</td>
        <td class="p-3 text-right text-cyan-400 font-bold">${res.discovery}%</td>
        <td class="p-3 text-right">${res.steps} 步</td>
        <td class="p-3 text-right text-amber-400">${res.time.toFixed(2)} ms</td>
        <td class="p-3 text-center text-emerald-400 font-bold">${score} 分</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// 應用程式初始化
window.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  window.app = new AppController();
});
